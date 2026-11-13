# PND利用状況

PND の各プール（CJPY / JPYC）の利用状況を、毎日21時（JST）に Discord へ投稿します。

```
**PND CJPY**
**Utilization:** 92%
**Supply:** 35,160,865 @ 6.1%
**Borrow:** 32,527,003 @ 7.5%
**Reserves:** -2,633,861
```

## 経緯

旧版は、どこで誰が動かしているか分からないまま、総合フォーラムの Webhook
「reportbot」経由で投稿され続けていました。同じ形式で作り直し、組織の
Cloudflare アカウントで動かすためのものです。旧版のソースは手に入っていません。

数値はすべてプール（Comet）のコントラクトから直接読みます。外部の API には
依存しません。丸め方は旧版の投稿から推定しています（`src/index.js` の冒頭を参照）。

## セットアップ

```bash
npm install

npx wrangler secret put RPC_URL               # Alchemy の URL（Spark と同じもので可）
npx wrangler secret put DISCORD_WEBHOOK_URL   # 投稿先（?thread_id= 込み）
npx wrangler secret put ALERT_WEBHOOK_URL     # #bot-失敗アラート
npx wrangler secret put TRIGGER_KEY           # 手動投稿用。適当なランダム文字列

npx wrangler deploy
```

確認用の URL:

```
https://pnd-monitor.<サブドメイン>.workers.dev/                        投稿せずに結果を表示
https://pnd-monitor.<サブドメイン>.workers.dev/?post=1&key=<TRIGGER_KEY>  投稿する
```

## 旧版からの切り替え手順

旧版は今も動いているので、数値を突き合わせてから切り替えます。

1. **`DISCORD_WEBHOOK_URL` に、まず `#bot-失敗アラート` の Webhook を設定してデプロイする。**
   本来のスレッドに投稿すると、旧版と二重になります。
2. 数日間、21時の投稿を旧版（PND利用状況スレッド）と見比べる。
   同じ時刻にブロックチェーンを読むので、数値は一致するはずです
   （取得の瞬間が数秒ずれるため、残高の末尾が1〜2違うことはありえます）。
3. 食い違いが丸め方によるものなら、`src/index.js` の整形関数を直す。
4. 一致を確認できたら:
   - 総合フォーラムに、組織で管理する Webhook を新しく作る
   - `DISCORD_WEBHOOK_URL` をその URL（`?thread_id=<PND利用状況スレッドのID>`）に差し替える
   - **旧 Webhook「reportbot」を削除する**（これで旧版の投稿が止まる）

Yamato利用状況も同じ「reportbot」を使っています。reportbot を削除すると
Yamato の旧版も同時に止まるので、**Yamato の新版ができてから削除してください**。

## プールを増減するとき

`src/index.js` の `POOLS` を編集してデプロイします。アドレスの出典は
`DeFiGeek-Community/comet-interface` の `constants/pools.ts` です。

## うまくいかないとき

| 症状 | 原因 |
|---|---|
| `空の応答が返りました` | プールのアドレスが違う |
| `RPC HTTP 401` / `403` / `429` | `RPC_URL` の鍵が無効、または使用量の上限 |
| `Webhook が存在しません (HTTP 404)` | Webhook が削除された。作り直して secret を差し替える |
| 21時に投稿が無く、アラートも無い | Cloudflare のダッシュボードで Cron の実行記録を確認 |
