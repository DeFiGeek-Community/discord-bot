/**
 * PND利用状況
 *
 * PND（Compound III のフォーク）の各プールの利用状況を、
 * 毎日 Discord に投稿します。
 *
 * 旧版は運営者が分からないまま、総合フォーラムの Webhook「reportbot」
 * 経由で毎日21時に投稿され続けていました。同じ形式で作り直し、
 * 組織の管理下に置くためのものです。
 *
 *   **PND CJPY**
 *   **Utilization:** 92%
 *   **Supply:** 35,160,865 @ 6.1%
 *   **Borrow:** 32,527,003 @ 7.5%
 *   **Reserves:** -2,633,861
 *
 * ── 数値の出どころ ──
 *
 * すべてプール（Comet）のコントラクトから直接読みます。
 *
 *   getUtilization()        利用率（1e18 = 100%）
 *   getSupplyRate(util)     預入金利（1秒あたり、1e18 = 100%）
 *   getBorrowRate(util)     借入金利（同上）
 *   totalSupply()           預入残高（トークンの最小単位）
 *   totalBorrow()           借入残高（同上）
 *   getReserves()           準備金（同上。符号付きで、負になりうる）
 *   decimals()              トークンの小数桁数
 *
 * ── 丸め方について ──
 *
 * 旧版のソースは手に入っていないため、投稿された数値から推定しています。
 *
 *   利用率 … 切り捨て。2026/11/11 の投稿は Supply 35,160,865 /
 *            Borrow 32,527,003（= 92.509%）で「92%」だった。
 *            四捨五入なら 93% になるはず。
 *   金利   … 小数第1位に四捨五入。同日の 7.484% → 7.5%、6.084% → 6.1%。
 *   残高   … 整数に四捨五入（根拠なし。切り捨ての可能性もある）。
 *
 * 旧版と並べて数日動かし、食い違いが出たらここを直してください。
 */

// プール一覧。出典は DeFiGeek-Community/comet-interface の constants/pools.ts。
// プールを増減するときは、ここだけ変えれば済みます。
const POOLS = [
  { name: 'PND CJPY', comet: '0xAA59F501c92092E624D30Cff77eAFf5EA4E7BfA2' },
  { name: 'PND JPYC', comet: '0x68cBE77063dbCF7de7F59cD8c0051e0B2A23BF75' },
];

// 関数セレクタ（keccak256 の先頭4バイト）
const SEL = {
  getUtilization: '0x7eb71131',
  getSupplyRate: '0xd955759d',   // (uint256)
  getBorrowRate: '0x9fa83b5a',   // (uint256)
  totalSupply: '0x18160ddd',
  totalBorrow: '0x8285ef40',
  getReserves: '0x0902f1ac',
  decimals: '0x313ce567',
};

const SECONDS_PER_YEAR = 31536000n;

const RPC_TIMEOUT_MS = 20000;
const RPC_RETRIES = 3;
const RPC_RETRY_WAIT_MS = 3000;

const DISCORD_RETRIES = 3;
const DISCORD_RETRY_WAIT_MS = 5000;

export default {
  /**
   * Cron Trigger から呼ばれます（毎日21時 JST）。
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runOrReportFailure(env));
  },

  /**
   * 手動確認用。
   *
   *   GET /                           計算結果を返すだけ（投稿しない）
   *   GET /?post=1&key=<TRIGGER_KEY>  投稿する
   *
   * 読み取りだけなら公開されていても実害はありません（オンチェーンの
   * 公開情報です）。投稿は鍵が必要です。
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
      return Response.json(await run(env, shouldPost));
    } catch (err) {
      return Response.json({ ok: false, error: String(err) }, { status: 500 });
    }
  },
};

// ─────────────────────────────────────────

/**
 * 定期実行用。失敗したら #bot-失敗アラート に通知します。
 *
 * 一部のプールだけ取得できた場合も、投稿はしません。
 * 片方が欠けた投稿は、欠けていることに気づかれにくいためです。
 */
async function runOrReportFailure(env) {
  try {
    return await run(env, true);
  } catch (err) {
    console.log('失敗: ' + err);

    const notice =
      ':x: **PND利用状況**\n' +
      '```' + String(err).slice(0, 1500) + '```\n' +
      '今日の分は投稿されていません。';

    // 運用投稿とは別の Webhook に送る。未設定なら運用側に送る。
    const alertUrl = env.ALERT_WEBHOOK_URL || env.DISCORD_WEBHOOK_URL;

    try {
      await postToDiscord(alertUrl, notice);
    } catch (notifyErr) {
      console.log('失敗の通知も送れませんでした: ' + notifyErr);
    }

    throw err;   // Cloudflare 側の実行記録にも失敗として残す
  }
}

async function run(env, shouldPost) {
  const pools = [];
  for (const pool of POOLS) {
    pools.push(await fetchPool(env, pool));
  }

  const message = buildMessage(pools);
  console.log(message.replace(/\n+/g, ' / '));

  if (shouldPost) {
    await postToDiscord(env.DISCORD_WEBHOOK_URL, message);
  }

  return {
    ok: true,
    posted: shouldPost,
    message,
    // 旧版と突き合わせるための生の値（文字列。桁が大きく JSON の数値に収まらない）
    raw: pools.map((p) => ({
      name: p.name,
      decimals: p.decimals,
      utilization: p.utilization.toString(),
      supplyRatePerSecond: p.supplyRate.toString(),
      borrowRatePerSecond: p.borrowRate.toString(),
      totalSupply: p.totalSupply.toString(),
      totalBorrow: p.totalBorrow.toString(),
      reserves: p.reserves.toString(),
    })),
  };
}

/**
 * 1つのプールの値を読みます。
 */
async function fetchPool(env, pool) {
  const call = (data) => ethCall(env, pool.comet, data).then(decodeWord);

  try {
    const [decimals, utilization, totalSupply, totalBorrow, reservesRaw] =
      await Promise.all([
        call(SEL.decimals),
        call(SEL.getUtilization),
        call(SEL.totalSupply),
        call(SEL.totalBorrow),
        call(SEL.getReserves),
      ]);

    // 金利は「その利用率のときの金利」を問い合わせる形になっている
    const arg = utilization.toString(16).padStart(64, '0');
    const [supplyRate, borrowRate] = await Promise.all([
      call(SEL.getSupplyRate + arg),
      call(SEL.getBorrowRate + arg),
    ]);

    if (decimals > 36n) {
      throw new Error('decimals の値が不正です: ' + decimals);
    }

    return {
      name: pool.name,
      decimals: Number(decimals),
      utilization,
      supplyRate,
      borrowRate,
      totalSupply,
      totalBorrow,
      reserves: toSigned(reservesRaw),
    };
  } catch (err) {
    throw new Error(`${pool.name}（${pool.comet}）の取得に失敗しました: ${err.message || err}`);
  }
}

// ─────────────────────────────────────────
// 整形
// ─────────────────────────────────────────

function buildMessage(pools) {
  return pools.map((p) =>
    `**${p.name}**\n` +
    `**Utilization:** ${formatUtilization(p.utilization)}%\n` +
    `**Supply:** ${formatAmount(p.totalSupply, p.decimals)} @ ${formatRate(p.supplyRate)}%\n` +
    `**Borrow:** ${formatAmount(p.totalBorrow, p.decimals)} @ ${formatRate(p.borrowRate)}%\n` +
    `**Reserves:** ${formatAmount(p.reserves, p.decimals)}`
  ).join('\n\n\n');
}

/**
 * 利用率（1e18 = 100%）を整数の % にします。切り捨て。
 */
function formatUtilization(util) {
  return (util / 10n ** 16n).toString();
}

/**
 * 1秒あたりの金利（1e18 = 100%）を、年率の % にします。小数第1位に四捨五入。
 *
 * 年率は単純に秒数を掛けたもの（複利ではない）。PND の画面や
 * 旧 INFO BOT と同じ計算です。
 */
function formatRate(ratePerSecond) {
  // 1e15 で割ると「0.1% 単位の値 × 1」になる（例: 7.484% → 74.84）
  const tenths = Number(ratePerSecond * SECONDS_PER_YEAR) / 1e15;
  return (Math.round(tenths) / 10).toFixed(1);
}

/**
 * トークンの最小単位の値を、整数に四捨五入して3桁区切りにします。
 * 負の値にも対応します（Reserves は負になる）。
 */
function formatAmount(value, decimals) {
  const unit = 10n ** BigInt(decimals);
  const negative = value < 0n;
  const abs = negative ? -value : value;

  const rounded = (abs + unit / 2n) / unit;
  const text = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (negative && rounded !== 0n ? '-' : '') + text;
}

// ─────────────────────────────────────────
// Ethereum RPC
// ─────────────────────────────────────────

/**
 * eth_call を投げます。一時的な失敗は間隔を空けて再試行します。
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
          params: [{ to, data }, 'latest'],
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
          // コントラクトが無いアドレスや、関数が存在しない場合に空が返る
          lastError = new Error('空の応答が返りました。プールのアドレスを確認してください。');
        } else {
          return json.result;
        }
      }
    } catch (err) {
      lastError = err;
    }

    console.log(`RPC 失敗（${i + 1}/${RPC_RETRIES}）: ${lastError}`);
    if (i < RPC_RETRIES - 1) await sleep(RPC_RETRY_WAIT_MS);
  }

  throw new Error('RPC の呼び出しに失敗しました: ' + lastError);
}

/**
 * 32バイトの返り値を BigInt にします。
 */
function decodeWord(hex) {
  const body = hex.replace(/^0x/, '');
  if (body.length < 64) {
    throw new Error(`応答が短すぎます（${body.length / 2} バイト）。`);
  }
  return BigInt('0x' + body.slice(0, 64));
}

/**
 * uint256 として読んだ値を、int256（2の補数）として解釈し直します。
 */
function toSigned(value) {
  return value >= 1n << 255n ? value - (1n << 256n) : value;
}

// ─────────────────────────────────────────
// Discord
// ─────────────────────────────────────────

/**
 * Discord に投稿します。429 と 5xx は待って再試行します。
 * 404 は Webhook が削除された場合なので、再試行しません。
 */
async function postToDiscord(webhookUrl, content) {
  if (!webhookUrl) {
    throw new Error('DISCORD_WEBHOOK_URL が未設定です。');
  }

  const payload = JSON.stringify({
    content,
    allowed_mentions: { parse: [] },
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
        'Webhook が存在しません (HTTP 404)。削除された可能性があります。: ' + body
      );
    }

    if (res.status === 429 || res.status >= 500) {
      let waitMs = DISCORD_RETRY_WAIT_MS;
      try {
        const j = JSON.parse(body);
        if (j.retry_after) waitMs = Math.ceil(Number(j.retry_after) * 1000) + 500;
      } catch (_) { /* 本文が JSON でないこともある */ }

      console.log(`Discord HTTP ${res.status}（${i + 1}/${DISCORD_RETRIES}）。${waitMs}ms 待ちます。`);

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

// テスト用（Workers の実行には影響しません）
export const _internal = { buildMessage, formatUtilization, formatRate, formatAmount, toSigned, decodeWord };