# cc-sdd概要
##　setup
あとで書く

## ベースの作成(kiro)
### kiroとは
AWS kiroの構成をパクってる


### steeringフェーズ
"PJのコアバリュー技術／やってほしくないことかく"

Example
```
/kiro:steering "エンジニアおみくじをつくりたいです。利用対象は主にソフトウェアエンジニアで、利用者の業務における運をお
みくじで試すためのアプリケーションです。使う技術はNextJs + 
Typescriptです。一般公開を想定しているので一旦ログインページは必要ないです。"
```

成果物
```
.kuro/product.md
.kiro/stucture.md
.kiro/tech.md
```

こんな感じになった
概ね良さそう
```product.md
# Product Overview

ソフトウェアエンジニア向けのおみくじアプリケーション。業務における運勢を占い、楽しく気軽に日々の運をチェックできるWebサービス。

## Core Capabilities

- エンジニアの業務に関連した運勢占い
- インタラクティブなおみくじ体験
- シンプルで使いやすいUI
- 認証不要でのすぐに利用可能

## Target Use Cases

- エンジニアの日々の業務における運試し
- チーム内でのコミュニケーションツール
- 開発作業の息抜きやモチベーション向上
- オープンな公開型Webサービスとしての利用

## Value Proposition

- エンジニア特化の文言とコンテンツ
- ログイン不要で気軽にアクセス
- 軽量でシンプルな構成
- 一般公開を前提とした設計

---
_Focus on patterns and purpose, not exhaustive feature lists_
```

その他
気に入らない場合はステアリングコマンドで修正してもらう
機能ごとにやってもいい

