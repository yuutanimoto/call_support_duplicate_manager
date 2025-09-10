# 重複データ管理システム

PostgreSQL データベースから取得した受信データの重複を検出し、管理者が重複データを確認・削除する Web アプリケーション

## 機能

- **重複データ検出**: 完全一致、受付内容、対応状況での重複検出
- **Web 表示**: データをテーブル形式で表示、ページネーション対応
- **フィルタリング**: 複数条件での絞り込み検索
- **削除操作**: 選択したデータの論理削除
- **レスポンシブ対応**: PC 専用設計（1200px 以上推奨）

## 技術スタック

- **バックエンド**: FastAPI, Python 3.8+
- **データベース**: PostgreSQL
- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **その他**: psycopg2, pydantic, uvicorn

## セットアップ

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env` ファイルを確認し、データベース接続情報を設定してください。

```
DB_HOST=192.168.225.91
DB_NAME=mcsystem
DB_USER=mcqc
DB_PASSWORD=qc5143720
DB_PORT=5432
```

### 3. アプリケーションの起動

```bash
python run.py
```

または

```bash
cd app
python main.py
```

## アクセス

起動後、以下の URL でアプリケーションにアクセスできます：

- **メイン画面**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs
- **ヘルスチェック**: http://localhost:8000/health

## API エンドポイント

- `GET /api/reception-data` - 受信データ取得
- `GET /api/duplicates/{type}` - 重複データ検出
- `POST /api/delete-duplicates` - 重複データ削除
- `GET /api/metadata` - マスタデータ取得

## 使用方法

1. **データ表示**: 起動時に自動的にデータが表示されます
2. **フィルタリング**: 上部の検索フィールドで条件を指定
3. **重複検出**: 「重複データを検出」ボタンで重複データを表示
4. **削除操作**: チェックボックスで選択後、削除ボタンをクリック

## ディレクトリ構成

```
fastapi_simple/
├── app/
│   ├── main.py                 # FastAPIアプリケーション本体
│   ├── database.py            # データベース接続管理
│   ├── models/               # データモデル定義
│   ├── services/             # ビジネスロジック
│   ├── api/                  # APIエンドポイント
│   ├── static/               # 静的ファイル
│   └── templates/            # HTMLテンプレート
├── run.py                    # 起動スクリプト
├── requirements.txt          # 依存関係
├── .env                      # 環境設定
└── README.md                 # このファイル
```

## 開発者向け

### 開発環境での起動

```bash
python run.py
```

リロード機能が有効になり、コード変更時に自動的に再起動します。

### データベース接続テスト

```bash
curl http://localhost:8000/health
```

### ログレベル調整

`.env` ファイルの `APP_DEBUG` を `False` に設定すると、本番モードで起動します。
