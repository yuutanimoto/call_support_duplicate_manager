# 開発ガイド

## 開発環境セットアップ

### 1. 必要な環境
- Python 3.8以上
- PostgreSQL（既存データベース）
- Git

### 2. プロジェクトのクローンと依存関係インストール
```bash
git clone <repository-url>
cd fastapi_simple
pip install -r requirements.txt
```

### 3. 環境変数設定
`.env`ファイルを作成し、以下の設定を行います：

```bash
# データベース接続設定
DB_HOST=192.168.225.91
DB_NAME=mcsystem
DB_USER=mcqc
DB_PASSWORD=qc5143720
DB_PORT=5432

# アプリケーション設定
APP_HOST=0.0.0.0
APP_PORT=8000
APP_DEBUG=True
```

### 4. アプリケーション起動
```bash
# 開発環境での起動（推奨）
python run.py

# または直接実行
cd app && python main.py
```

## プロジェクト構成

```
fastapi_simple/
├── app/                    # アプリケーション本体
│   ├── main.py            # FastAPIアプリケーション
│   ├── database.py        # データベース接続管理
│   ├── api/               # APIエンドポイント
│   │   ├── reception_data.py  # データ取得API
│   │   ├── duplicates.py      # 重複検出API
│   │   └── operations.py      # 操作API
│   ├── models/            # データモデル
│   │   ├── request_models.py  # リクエストモデル
│   │   └── response_models.py # レスポンスモデル
│   ├── services/          # ビジネスロジック
│   │   ├── data_service.py    # データ取得サービス
│   │   ├── duplicate_service.py # 重複検出サービス
│   │   ├── delete_service.py   # 削除サービス
│   │   └── restore_service.py  # 復元サービス
│   ├── static/            # 静的ファイル
│   │   ├── css/          # スタイルシート
│   │   └── js/           # JavaScript
│   └── templates/         # HTMLテンプレート
├── docs/                  # ドキュメント
├── run.py                 # 起動スクリプト
├── requirements.txt       # 依存関係
├── .env                   # 環境設定
└── README.md             # プロジェクト説明
```

## コーディング規約

### Python
- **PEP 8**に準拠
- **型ヒント**を必須で使用
- **Pydantic**モデルでデータバリデーション
- **docstring**で関数の説明を記載

#### 例：
```python
from typing import List, Optional, Tuple
from models.response_models import ReceptionDataRecord

def get_reception_data(
    offset: int = 0,
    limit: int = 100,
    filters: Optional[FilterRequest] = None
) -> Tuple[List[ReceptionDataRecord], int]:
    """受信データ取得
    
    Args:
        offset: データ開始位置
        limit: 取得件数
        filters: フィルター条件
        
    Returns:
        (レコードリスト, 総件数)のタプル
    """
```

### JavaScript
- **ES6+**の機能を活用
- **モジュール化**によるファイル分割
- **async/await**でPromise処理
- **関数コメント**でJSDoc形式

#### 例：
```javascript
/**
 * API呼び出し
 * @param {string} endpoint - APIエンドポイント
 * @param {Object} options - リクエストオプション
 * @returns {Promise<Object>} APIレスポンス
 */
async function apiCall(endpoint, options = {}) {
    // 実装
}
```

## 主要機能の実装パターン

### キーワード検索機能の実装

#### 分離型キーワード検索（推奨）
```python
# DataService.build_filter_conditions() での実装例
if filters.content_keyword:
    conditions.append("receptbody.rdata ILIKE %s")
    params.append(f"%{filters.content_keyword}%")

if filters.status_keyword:
    conditions.append("COALESCE(execbody.execstate, '') ILIKE %s")
    params.append(f"%{filters.status_keyword}%")
```

#### 後方互換性（統合キーワード検索）
```python
if filters.keyword and not filters.content_keyword and not filters.status_keyword:
    conditions.append("""
        (receptbody.rdata ILIKE %s
         OR COALESCE(execbody.execstate, '') ILIKE %s)
    """)
    keyword_param = f"%{filters.keyword}%"
    params.extend([keyword_param, keyword_param])
```

### 統計情報機能の実装
```python
# 有効データ・削除済みデータを分離して計算
def get_statistics(filters: Optional[FilterRequest] = None) -> dict:
    # 有効データ数（削除済み除外）
    active_filters = FilterRequest(**{**base_filters, "include_deleted": False})
    
    # 全データ数（削除済み含む）  
    all_filters = FilterRequest(**{**base_filters, "include_deleted": True})
    
    # 削除済み数 = 全データ数 - 有効データ数
    deleted_count = total_count - active_count
```

### データ復元機能の実装
```python
# RestoreService での実装例
restore_query = """
UPDATE recepthead
SET receptmoddt = NULL
WHERE extentid = ANY(%s)
AND receptmoddt IS NOT NULL
"""
restored_count = db_manager.execute_update(restore_query, (request.target_ids,))
```

## 新機能開発の手順

### 1. API機能の追加

#### ステップ1: モデル定義
`app/models/`にリクエスト/レスポンスモデルを定義

```python
# app/models/request_models.py
class NewFeatureRequest(BaseModel):
    field1: str
    field2: Optional[int] = None

# app/models/response_models.py  
class NewFeatureResponse(BaseModel):
    result: str
    data: List[dict]
```

#### ステップ2: サービス層実装
`app/services/`にビジネスロジックを実装

```python
# app/services/new_service.py
class NewService:
    @staticmethod
    def process_data(request: NewFeatureRequest) -> NewFeatureResponse:
        # ビジネスロジック実装
        pass
```

#### ステップ3: API層実装
`app/api/`にエンドポイントを実装

```python
# app/api/new_feature.py
from fastapi import APIRouter
router = APIRouter()

@router.post("/new-feature", response_model=NewFeatureResponse)
async def new_feature_endpoint(request: NewFeatureRequest):
    return NewService.process_data(request)
```

#### ステップ4: ルーター登録
`app/main.py`にルーターを登録

```python
from api import new_feature
app.include_router(new_feature.router, prefix="/api", tags=["新機能"])
```

### 2. フロントエンド機能の追加

#### ステップ1: JavaScript モジュール作成
`app/static/js/`に機能別JSファイルを作成

#### ステップ2: CSSスタイル追加
`app/static/css/style.css`にスタイルを追加

#### ステップ3: HTML更新
`app/templates/`のテンプレートを更新

## データベース操作

### クエリ実行パターン
```python
# 単一クエリ実行
result = db_manager.execute_query(query, params)

# 更新クエリ実行
affected_rows = db_manager.execute_update(query, params)

# コンテキストマネージャーを使った複雑な処理
with db_manager.get_connection() as conn:
    with conn.cursor() as cursor:
        cursor.execute(query1, params1)
        cursor.execute(query2, params2)
        conn.commit()
```

### パフォーマンス考慮事項
- **大量データ処理**では必ずLIMIT/OFFSETを使用
- **複雑なJOIN**では適切なインデックスを確認
- **重複検出**ではWindow関数を活用（PARTITION BY + ROW_NUMBER()）
- **日時フィールド**はタイムゾーン変換を忘れずに（AT TIME ZONE 'Asia/Tokyo'）
- **統計情報**は別クエリで計算（メインデータ取得への影響を避ける）
- **キーワード検索**ではILIKE演算子を使用（大文字小文字区別なし）

## テストとデバッグ

### 開発用エンドポイント
- **メイン画面**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs  
- **ヘルスチェック**: http://localhost:8000/health

### デバッグ設定
`APP_DEBUG=True`で以下が有効になります：
- **自動リロード**: コード変更時の自動再起動
- **詳細ログ**: INFO レベルのログ出力
- **アクセスログ**: HTTPリクエストの詳細ログ

### よくあるエラーと対処法

#### データベース接続エラー
```
データベース接続エラー: could not connect to server
```
**対処法**: `.env`ファイルのDB設定を確認

#### モジュールインポートエラー
```
ModuleNotFoundError: No module named 'xxx'
```
**対処法**: `pip install -r requirements.txt`を実行

#### 重複検出でデータが取得できない
```
重複検出結果が空
```
**対処法**: 
- 対象データの存在確認（2015年1月1日以降のデータ）
- 削除済みデータフィルター確認（receptmoddt IS NULL条件）
- 重複検出条件の確認（rdata、execstate等がNULLでない）

#### タイムゾーン関連エラー
```
Timestamp format error
```
**対処法**: 日時フィールドに `AT TIME ZONE 'Asia/Tokyo'` を付与

## デプロイ考慮事項

### 本番環境設定
```bash
APP_DEBUG=False
APP_HOST=0.0.0.0
APP_PORT=8000
```

### セキュリティチェックリスト
- [ ] データベース認証情報が環境変数で管理されている
- [ ] 本番環境でAPP_DEBUG=Falseになっている
- [ ] 不要なCORSオリジンが許可されていない
- [ ] SQLインジェクション対策（パラメータ化クエリ）が実装されている

## コードレビューチェックリスト

### Python
- [ ] 型ヒントが正しく記載されている
- [ ] エラーハンドリングが適切に実装されている
- [ ] SQLクエリがパラメータ化されている
- [ ] ビジネスロジックがサービス層に分離されている

### JavaScript
- [ ] エラーハンドリングが実装されている
- [ ] 非同期処理が適切に実装されている
- [ ] DOM操作が効率的に実装されている
- [ ] ユーザビリティが考慮されている