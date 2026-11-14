/**
 * Spark Position Monitor
 *
 * Safe が SparkLend に持つレンディングポジションを監視し、
 * 毎日 Discord に投稿します。
 *
 * 旧版（2026年4月23日に停止）と同じ形式で投稿します。
 *   Health: 1.69, 担保: $516586, 負債: $265229
 *
 * 加えて、Health が閾値を下回ったときに警告を出します。
 * 清算リスクの可視化がこの仕組みの本来の目的なので、
 * 数値を並べるだけでなく、危険な水準を知らせます。
 */

// SparkLend は Aave V3 のフォーク。
// Pool.getUserAccountData(address) が6つの uint256 を返す。
//   [0] totalCollateralBase   担保（1e8 = USD）
//   [1] totalDebtBase         負債（1e8 = USD）
//   [2] availableBorrowsBase  追加で借りられる額
//   [3] currentLiquidationThreshold
//   [4] ltv
//   [5] healthFactor          1e18。無借金なら uint256 の最大値
const SELECTOR_GET_USER_ACCOUNT_DATA = '0xbf92857c';

const RPC_TIMEOUT_MS = 20000;
const RPC_RETRIES = 3;
const RPC_RETRY_WAIT_MS = 3000;

const DISCORD_RETRIES = 3;
const DISCORD_RETRY_WAIT_MS = 5000;

export default {
  /**
   * Cron Trigger から呼ばれます（毎日21時 JST）。
   *
   * 失敗したときは Discord に失敗を知らせます。
   * 旧版が止まったことに半年気づけなかったのは、
   * 落ちても誰にも何も届かなかったからです。
   * 「投稿が来ない」より「エラーが来た」の方が気づけます。
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runOrReportFailure(env));
  },

  /**
   * 手動確認用。
   *
   *   GET /            → 計算結果を返すだけ（投稿しない）
   *   GET /?post=1&key=<TRIGGER_KEY>  → 投稿する
   *
   * ポジションの情報はオンチェーンで誰でも見られるため、
   * 読み取りだけなら公開されていても実害はありません。
   * 投稿は鍵が必要です。誰でも叩けるとスレッドを荒らせるためです。
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const shouldPost = url.searchParams.get('post') === '1';

    if (shouldPost) {
      if (!env.TRIGGER_KEY || url.searchParams.get('key') !== env.TRIGGER_KEY) {
        return new Response('unauthorized', { status: 401 });
      }
    }

    try {
      const result = await run(env, shouldPost);
      return Response.json(result);
    } catch (err) {
      return Response.json({ ok: false, error: String(err) }, { status: 500 });
    }
  },
};

// ─────────────────────────────────────────

/**
 * 定期実行用。失敗したらその旨を Discord に投稿します。
 *
 * 失敗の通知自体も失敗することはあり得ます（Webhook 削除など）。
 * そのときはログに残すしかありませんが、
 * Cloudflare のダッシュボードで Cron の失敗は確認できます。
 */
async function runOrReportFailure(env) {
  try {
    return await run(env, true);
  } catch (err) {
    console.log('失敗: ' + err);

    const notice =
      ':x: **Spark Position Monitor の取得に失敗しました**\n' +
      '```' + String(err).slice(0, 1500) + '```\n' +
      'ポジションの値ではなく、監視の仕組み側の問題です。';

    // 通知は専用のアラートチャンネルに送る。
    // 「Webhook が死んでいる」が障害の典型なので、
    // 運用投稿と同じ Webhook に投げると肝心なときに届かない。
    // 未設定なら運用側に送る（何も届かないよりはまし）。
    const alertUrl = env.ALERT_WEBHOOK_URL || env.DISCORD_WEBHOOK_URL;

    try {
      await postToDiscord(alertUrl, notice);
    } catch (notifyErr) {
      console.log('失敗の通知も送れませんでした: ' + notifyErr);
    }

    throw err;   // Cloudflare 側の実行ログに失敗として残す
  }
}

async function run(env, shouldPost) {
  const position = await fetchPosition(env);
  const message = buildMessage(position, env);

  console.log(message.replace(/\n/g, ' / '));

  if (!shouldPost) {
    return { ok: true, posted: false, position, message };
  }

  await postToDiscord(env.DISCORD_WEBHOOK_URL, message);
  return { ok: true, posted: true, position, message };
}

/**
 * Safe のポジションを読み取ります。
 */
async function fetchPosition(env) {
  const safe = requireEnv(env, 'SAFE_ADDRESS').toLowerCase().replace(/^0x/, '');
  const pool = requireEnv(env, 'SPARK_POOL');

  // address は 32 バイトに左ゼロ詰め
  const data = SELECTOR_GET_USER_ACCOUNT_DATA + safe.padStart(64, '0');

  const raw = await ethCall(env, pool, data);
  const words = decodeWords(raw, 6);

  const collateral = Number(words[0]) / 1e8;
  const debt = Number(words[1]) / 1e8;

  // 借入がない場合、healthFactor は uint256 の最大値になる
  const MAX_UINT = (1n << 256n) - 1n;
  const health = words[5] === MAX_UINT ? null : Number(words[5]) / 1e18;

  return {
    collateral: collateral,
    debt: debt,
    health: health,
    liquidationThreshold: Number(words[3]) / 10000,
    availableBorrows: Number(words[2]) / 1e8,
  };
}

/**
 * 投稿文を組み立てます。
 *
 * 1行目は旧版と同じ形式。Health が閾値を下回ったときだけ
 * 警告を付け足します。
 */
function buildMessage(p, env) {
  const health = p.health === null ? '—' : p.health.toFixed(2);
  let message =
    `Health: ${health}, 担保: $${Math.round(p.collateral)}, 負債: $${Math.round(p.debt)}`;

  const warnAt = Number(env.WARN_HEALTH || '1.3');

  if (p.health !== null && p.health < warnAt) {
    const mention = env.ALERT_ROLE_ID ? `<@&${env.ALERT_ROLE_ID}> ` : '';
    message =
      `${mention}:warning: **Health が ${warnAt} を下回っています**\n` +
      message + '\n' +
      `Health が 1.00 を下回ると清算されます。担保の追加、または返済を検討してください。`;
  }

  return message;
}

// ─────────────────────────────────────────
// Ethereum RPC
// ─────────────────────────────────────────

/**
 * eth_call を投げます。
 *
 * 公開 RPC は混雑すると 429 や一時的なエラーを返すため、
 * 間隔を空けて再試行します。1日1回の処理なので、
 * 1回の失敗で翌日まで待つのは避けたいところです。
 */
async function ethCall(env, to, data) {
  const rpcUrl = requireEnv(env, 'RPC_URL');

  let lastError = null;

  for (let i = 0; i < RPC_RETRIES; i++) {
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: to, data: data }, 'latest'],
        }),
        signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
      });

      if (!res.ok) {
        lastError = new Error('RPC HTTP ' + res.status);
      } else {
        const json = await res.json();

        if (json.error) {
          lastError = new Error('RPC エラー: ' + JSON.stringify(json.error));
        } else if (!json.result || json.result === '0x') {
          // コントラクトアドレスが違う場合などに空が返る
          lastError = new Error(
            '空の応答が返りました。SPARK_POOL のアドレスを確認してください。'
          );
        } else {
          return json.result;
        }
      }
    } catch (err) {
      lastError = err;
    }

    console.log(`RPC 失敗（${i + 1}/${RPC_RETRIES}）: ${lastError}`);
    if (i < RPC_RETRIES - 1) {
      await sleep(RPC_RETRY_WAIT_MS);
    }
  }

  throw new Error('RPC の呼び出しに失敗しました: ' + lastError);
}

/**
 * 返り値を 32 バイトごとに区切って BigInt にします。
 */
function decodeWords(hex, count) {
  const body = hex.replace(/^0x/, '');
  const expected = count * 64;

  if (body.length < expected) {
    throw new Error(
      `応答が短すぎます（${body.length / 2} バイト、期待 ${expected / 2} バイト）。` +
      'コントラクトか関数が想定と違う可能性があります。'
    );
  }

  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(BigInt('0x' + body.slice(i * 64, (i + 1) * 64)));
  }
  return words;
}

// ─────────────────────────────────────────
// Discord
// ─────────────────────────────────────────

/**
 * Discord に投稿します。
 *
 * 429（レート制限）のときは Discord が返す retry_after に従って待ちます。
 * 404 は Webhook が削除された場合なので、再試行しても無駄です。
 * すぐに諦めてエラーを投げます。
 */
async function postToDiscord(webhookUrl, content) {
  if (!webhookUrl) {
    throw new Error('DISCORD_WEBHOOK_URL が未設定です。');
  }

  const payload = JSON.stringify({
    content: content,
    // 役割メンションは警告時のみ意図的に鳴らす。
    // それ以外のメンションは発火させない。
    allowed_mentions: { parse: ['roles'] },
  });

  for (let i = 0; i < DISCORD_RETRIES; i++) {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });

    if (res.ok) {
      console.log('投稿しました。');
      return;
    }

    const body = await res.text();

    if (res.status === 404) {
      throw new Error(
        'Webhook が存在しません (HTTP 404)。削除された可能性があります。' +
        'DISCORD_WEBHOOK_URL を差し替えてください。: ' + body
      );
    }

    if (res.status === 429 || res.status >= 500) {
      let waitMs = DISCORD_RETRY_WAIT_MS;
      try {
        const j = JSON.parse(body);
        if (j.retry_after) waitMs = Math.ceil(Number(j.retry_after) * 1000) + 500;
      } catch (_) { /* 本文が JSON でないこともある */ }

      console.log(
        `Discord HTTP ${res.status}（${i + 1}/${DISCORD_RETRIES}）。` +
        `${waitMs}ms 待って再試行します。`
      );

      if (i < DISCORD_RETRIES - 1) {
        await sleep(waitMs);
        continue;
      }
    }

    throw new Error(`Discord への投稿に失敗しました (HTTP ${res.status}): ${body}`);
  }

  throw new Error('Discord への投稿を諦めました。');
}

// ─────────────────────────────────────────

function requireEnv(env, name) {
  const v = env[name];
  if (!v) throw new Error(`${name} が未設定です。`);
  return v;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}