# Spark Position Monitor

DFGC の Safe が SparkLend に持つレンディングポジションを毎日 Discord に投稿します。
2026年4月23日に停止した旧 Bot の作り直しです。

```
Health: 1.50, 担保: $512359, 負債: $288256
```

Health が閾値を下回ったときは、警告を付けて投稿します。

```
:warning: **Health が 1.3 を下回っています**
Health: 1.20, 担保: $512359, 負債: $288256
Health が 1.00 を下回ると清算されます。担保の追加、または返済を検討してください。
```

---

## 旧版について分かっていること／分かっていないこと

**分かっていること**

- 最終投稿は 2026年4月23日 21:11。前任者のアカウント削除（4月22日）の直後に止まっている
- 投稿形式は `Health: 1.69, 担保: $516586, 負債: $265229`
- 毎日21時ごろに投稿されていた

**分かっていないこと**

- どこで動いていたか（Apps Script のプロジェクト一覧にはなかった）
- どの RPC を使っていたか
- 誰が作ったか

出所が追えないため、同じ投稿形式を再現する形で新規に作り直しました。
ソースコードは一切引き継いでいません。

旧版の数値が `Pool.getUserAccountData()` の戻り値をそのまま整形したものであることは、
4月23日の投稿（Health 1.69 / 担保 $516586 / 負債 $265229）が
この実装で桁・丸め・区切りまで一致することで確認しています。

---

## 仕組み

Cloudflare Workers の Cron Trigger が毎日 12:00 UTC（= 21:00 JST）に起動し、

1. Ethereum の RPC に `eth_call` を1回投げる
2. SparkLend の `Pool.getUserAccountData(Safe アドレス)` を読む
3. 戻り値（担保・負債・Health）を整形して Discord Webhook に投稿する

SparkLend は Aave V3 のフォークなので、`getUserAccountData` が使えます。
戻り値は uint256 が6つで、使うのは3つです。

| 位置 | 内容 | 単位 |
|---|---|---|
| 0 | totalCollateralBase（担保） | USD、1e8 |
| 1 | totalDebtBase（負債） | USD、1e8 |
| 2 | availableBorrowsBase | USD、1e8 |
| 3 | currentLiquidationThreshold | bps |
| 4 | ltv | bps |
| 5 | **healthFactor** | 1e18。借入ゼロなら uint256 の最大値 |

借入がないときの healthFactor は `2^256 - 1` という巨大な値になります。
そのまま割ると天文学的な数字が出るので、最大値のときは `—` と表示します。

---

## セットアップ

### 1. RPC を用意する

Ethereum の読み取り専用 RPC が必要です。組織の共有メールアドレスで無料アカウントを作ってください。
1日1回の `eth_call` 1本なので、無料枠を使い切ることはまずありません。

- **Alchemy** — https://www.alchemy.com/ 無料枠 月3億 CU
- **Infura** — https://www.infura.io/ 無料枠 1日300万リクエスト

作成後に取得する `https://eth-mainnet.g.alchemy.com/v2/xxxxx` のような URL を使います。
この URL は鍵と同じ扱いにしてください（secret に入れます）。

> 公開 RPC（`https://eth.llamarpc.com` など）でも動きますが、
> 予告なく止まったり制限されたりします。組織アカウントを推奨します。
> これも「個人・外部依存を減らす」話の一部です。

### 2. Discord Webhook を用意する

Spark Position Monitor スレッドに投稿する Webhook を新規作成します。

1. 親チャンネルの「設定」→「連携サービス」→「ウェブフックを作成」
2. 作成した Webhook の URL をコピー
3. スレッドに投稿するため、URL の末尾に `?thread_id=<スレッドID>` を付ける

スレッド ID は、Discord でスレッドを右クリック →「IDをコピー」で取得できます
（開発者モードが必要です）。

### 3. デプロイする

```bash
cd spark
npm install

# Safe アドレスを wrangler.toml の SAFE_ADDRESS に記入
#   マルチシグ署名履歴の SAFE_ADDRESS と同じ 0x153d… です

npx wrangler secret put RPC_URL
npx wrangler secret put DISCORD_WEBHOOK_URL   # Spark Position Monitor スレッド
npx wrangler secret put ALERT_WEBHOOK_URL     # #bot-失敗アラート
npx wrangler secret put TRIGGER_KEY           # 手動実行用。適当なランダム文字列

npx wrangler deploy
```

### 4. 動作確認

デプロイすると `https://spark-position-monitor.<サブドメイン>.workers.dev` が払い出されます。

**投稿せずに値だけ確認**

```
https://spark-position-monitor.xxx.workers.dev/
```

JSON が返ります。この数値を DeBank の表示と見比べてください。

```json
{
  "ok": true,
  "posted": false,
  "position": {
    "collateral": 512359.28,
    "debt": 288256.02,
    "health": 1.50,
    "liquidationThreshold": 0.8,
    "availableBorrows": 121631.4
  },
  "message": "Health: 1.50, 担保: $512359, 負債: $288256"
}
```

**一致していれば、`SPARK_POOL` と `SAFE_ADDRESS` が両方正しいことの証明になります。**
両方正しくないと、この3つの数値が揃うことはありません。

もし `空の応答が返りました` というエラーになったら、`SPARK_POOL` か `SAFE_ADDRESS` が違います。

**実際に投稿してみる**

```
https://spark-position-monitor.xxx.workers.dev/?post=1&key=<TRIGGER_KEY>
```

### 5. 翌日21時を待つ

Cron が動いたかは Cloudflare のダッシュボードで確認できます。
Workers → spark-position-monitor → ログ。

---

## 設定項目

`wrangler.toml` の `[vars]`（公開されても困らない値）

| 名前 | 内容 |
|---|---|
| `SAFE_ADDRESS` | 監視する Safe のアドレス |
| `SPARK_POOL` | SparkLend の Pool。変更不要 |
| `WARN_HEALTH` | 警告を出す Health の閾値。既定 `1.3` |
| `ALERT_ROLE_ID` | 警告時にメンションするロールID。空ならメンションしない |

secret（`npx wrangler secret put <名前>` で設定）

| 名前 | 内容 |
|---|---|
| `RPC_URL` | Ethereum RPC の URL |
| `DISCORD_WEBHOOK_URL` | 投稿先 Webhook（`?thread_id=` 込み） |
| `ALERT_WEBHOOK_URL` | 失敗通知の送り先。`#bot-失敗アラート` の Webhook |
| `TRIGGER_KEY` | 手動投稿用の鍵 |

`ALERT_WEBHOOK_URL` を運用投稿と分けているのは、「Webhook が削除された」が
障害の典型だからです。同じ Webhook に失敗を投げると、一番知りたいときに届きません。
未設定の場合は運用側の Webhook に送ります。

### 閾値をどう決めるか

`WARN_HEALTH` の既定値は 1.3 にしてあります。

Health が 1.00 を下回ると清算されます。
過去の実績は 1.69（4月）→ 1.50（現在）で、下がる方向に動いています。
1.3 なら、清算までまだ余裕がある段階で気づけます。

厳しすぎると毎日警告が鳴って誰も読まなくなり、
緩すぎると気づいたときには手遅れになります。
運用してみて、鳴りすぎる／鳴らなすぎると感じたら調整してください。
`wrangler.toml` を書き換えて `npx wrangler deploy` で反映されます。

---

## 旧版と変えたところ

同じ数値を出すだけでは、また同じように静かに止まります。
BOTS.md にまとめた8つの失敗パターンのうち、この Bot に関係するものに手を打ちました。

**1. 止まったことが分かるようにした**

取得に失敗したら、失敗した旨を Discord に投稿します。
旧版は落ちても何も起きなかったので、止まっていることに半年気づけませんでした。
「投稿が来ない」は気づけませんが、「エラーが来た」は気づけます。

**2. 一時的な失敗で諦めないようにした**

RPC は3回まで、3秒おきに再試行します。
Discord の 429 は、Discord が返す `retry_after` に従って待ちます。
1日1回しか動かないので、1回の失敗で翌日まで待つのは避けたいところです。

**3. 個人に紐づくものをなくした**

Cloudflare Workers の Cron Trigger は、アカウントではなく Worker に紐づきます。
Apps Script のトリガーのように「作った人が抜けると消える」ことがありません。

**4. 値の意味を書き残した**

1e8 や 1e18 のスケール、uint256 最大値の扱いをコードにコメントで残しました。
次に引き継ぐ人が、数字の出どころを追えるようにしてあります。

**5. 清算リスクを可視化した**

元々この仕組みの目的は、数値を並べることではなく清算を避けることだったはずです。
Health の閾値割れを警告するようにしました。

---

## うまくいかないとき

| 症状 | 原因 |
|---|---|
| `空の応答が返りました` | `SPARK_POOL` か `SAFE_ADDRESS` が違う |
| `応答が短すぎます` | `SPARK_POOL` が SparkLend ではない別のコントラクト |
| `Webhook が存在しません (HTTP 404)` | Webhook が削除された。作り直して secret を差し替える |
| `RPC HTTP 401` / `403` | `RPC_URL` の鍵が無効、または使用量上限 |
| 数値が DeBank と合わない | Safe が複数ある。DeBank で担保が出ている方のアドレスを使う |
| Health が `—` | 借入がゼロ。異常ではない |
