# discord-bot

DeFiGeek Community Japan の Discord に、オンチェーンの公開データを投稿する
仕組みを置くリポジトリです。

ここに入れるのは、**公開されているデータを読むだけのもの**に限ります。
メンバーの識別情報・報酬・署名に関わるものは、非公開の
`internal-operations-bot` リポジトリで管理しています。全体の台帳
（どの Bot がどこで動いているか）もそちらの `docs/BOTS.md` にあります。

## 構成

| ディレクトリ | 内容 | 動いている場所 | 状態 |
| --- | --- | --- | --- |
| `workers/spark-monitor/` | Safe の SparkLend ポジション（Health・担保・負債）を毎日21時に投稿 | Cloudflare Workers | デプロイ待ち |
| `workers/pnd-monitor/` | PND 各プールの利用状況を毎日21時に投稿 | Cloudflare Workers | デプロイ待ち（旧版と突き合わせ後に切り替え） |
| `info-bots-legacy/` | 旧 INFO BOT（ニックネームに数値を表示する Bot 群）と TXJP 流通量 API | fly.io | **停止。保管のみ** |

各 Worker の設定とデプロイ方法は、それぞれのディレクトリの README を参照してください。

## 共通の決まり

- **秘密情報をコミットしない。** RPC の URL、Webhook の URL、Bot トークンは
  `wrangler secret put` で設定します。ローカル用の `.dev.vars` と `.env` は
  `.gitignore` に入っています。このリポジトリは公開です
- Cloudflare、Alchemy などのアカウントは、組織の共有メールアドレスのものを使う
- 失敗したら Discord の `#bot-失敗アラート` に通知する。運用投稿とは別の
  Webhook（`ALERT_WEBHOOK_URL`）を使う
- デプロイしたコードとリポジトリを一致させる。デプロイしたらコミットする

## `info-bots-legacy/` について

discord.js v12 で書かれた常駐型の Bot 群で、fly.io の停止とともに動かなく
なりました。2025年1月時点のコードを、動いていた当時の構成のまま保管しています。

PND / Yamato の計算式やコントラクトのアドレスは、ここが一次資料です。
新しい Worker はこのコードの計算を引き継いでいます。

そのままでは復活させない方針です（参照している外部 API の一部が廃止済みで、
ホスティングも失われています）。作り直す場合は `workers/` に新しく作ります。
