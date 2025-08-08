# API リファレンス

## エンドポイント一覧

### 1. 受信データ取得 API
**GET** `/api/reception-data`

受信データを取得し、ページネーションとフィルタリングをサポートします。

#### クエリパラメータ
| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `offset` | int | 0 | データ開始位置（0以上） |
| `limit` | int | 100 | 取得件数（1-500） |
| `sort_by` | str | "reception_datetime" | ソート列 |
| `sort_order` | str | "desc" | ソート順（asc/desc） |
| `keyword` | str | null | キーワード検索（後方互換性） |
| `content_keyword` | str | null | 受付内容キーワード |
| `status_keyword` | str | null | 対応状況キーワード |
| `progress` | str | null | 進捗フィルター |
| `system_type` | str | null | システム種別フィルター |
| `product` | str | null | 製品フィルター |
| `date_from` | str | null | 開始日時（ISO形式） |
| `date_to` | str | null | 終了日時（ISO形式） |
| `date_field` | str | "reception_datetime" | 日付フィルター対象 |
| `include_deleted` | bool | false | 削除済みデータを含む |

#### レスポンス
```json
{
  "data": [
    {
      "id": 123,
      "content": "受付内容",
      "status": "対応状況",
      "result": "結果",
      "report": "レポート",
      "progress": "進捗",
      "system_type": "システム種別",
      "product": "製品",
      "reception_moddt": null,
      "reception_datetime": "2023-01-01T10:00:00+09:00",
      "update_datetime": "2023-01-01T10:00:00+09:00"
    }
  ],
  "total": 1000,
  "offset": 0,
  "limit": 100,
  "has_more": true,
  "statistics": {
    "total_records": 1500,
    "active_records": 1000,
    "deleted_records": 500
  }
}
```

### 2. 重複データ検出 API
**GET** `/api/duplicates/{duplicate_type}`

指定された重複タイプでデータを検出します。

#### パスパラメータ
| パラメータ | 値 | 説明 |
|---|---|---|
| `duplicate_type` | exact | 完全一致重複（受付内容+対応状況） |
|  | content | 受付内容重複 |
|  | status | 対応状況重複 |

#### クエリパラメータ
reception-data APIと同じフィルタリングパラメータをサポート
- `keyword` （後方互換性）
- `content_keyword` （受付内容検索）
- `status_keyword` （対応状況検索）
- `progress`, `system_type`, `product`
- `date_from`, `date_to`, `date_field`
- `include_deleted`

#### レスポンス
```json
{
  "duplicates": [
    {
      "group_id": "group_0",
      "duplicate_count": 3,
      "duplicate_key": "重複キー値",
      "records": [
        {
          "id": 123,
          "content": "受付内容",
          "duplicate_type": "exact",
          "duplicate_key": "重複キー値"
          // ... その他のフィールド
        }
      ]
    }
  ],
  "total_groups": 5,
  "total_duplicates": 15
}
```

### 3. 重複データ削除 API
**POST** `/api/delete-duplicates`

選択されたデータを論理削除します。

#### リクエストボディ
```json
{
  "target_ids": [123, 456, 789],
  "delete_scope": "selected",
  "filter_conditions": {
    "keyword": "検索キーワード",
    "progress": "進捗値",
    // ... その他のフィルター条件
  }
}
```

#### レスポンス
```json
{
  "success": true,
  "deleted_count": 3,
  "failed_ids": [],
  "timestamp": "2023-01-01T10:00:00+09:00"
}
```

### 4. メタデータ取得 API
**GET** `/api/metadata`

フィルタリング用のマスターデータと列定義を取得します。

#### レスポンス
```json
{
  "progress_options": ["未着手", "進行中", "完了"],
  "system_type_options": ["システムA", "システムB"],
  "product_options": ["製品X", "製品Y"],
  "column_definitions": [
    {
      "id": "id",
      "name": "ID",
      "type": "number",
      "filterable": true,
      "sortable": true
    }
  ]
}
```

### 5. データ復元 API
**POST** `/api/restore-records`

削除済みデータを復元します。

#### リクエストボディ
```json
{
  "target_ids": [123, 456, 789]
}
```

#### レスポンス
```json
{
  "success": true,
  "restored_count": 3,
  "failed_ids": [],
  "timestamp": "2023-01-01T10:00:00+09:00"
}
```

### 6. ヘルスチェック API
**GET** `/health`

アプリケーションとデータベースの接続状態を確認します。

#### レスポンス
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## データモデル

### ReceptionDataRecord
```python
class ReceptionDataRecord(BaseModel):
    id: int                                    # レコードID
    content: Optional[str]                     # 受付内容
    status: Optional[str]                      # 対応状況
    result: Optional[str]                      # 結果
    report: Optional[str]                      # レポート
    progress: Optional[str]                    # 進捗
    system_type: Optional[str]                 # システム種別
    product: Optional[str]                     # 製品
    reception_moddt: Optional[datetime]        # 削除フラグ日時
    reception_datetime: Optional[datetime]     # 受付日時
    update_datetime: Optional[datetime]        # 更新日時
    duplicate_count: Optional[int]             # 重複数
    duplicate_type: Optional[str]              # 重複タイプ
    duplicate_key: Optional[str]               # 重複キー
```

### FilterRequest
```python
class FilterRequest(BaseModel):
    keyword: Optional[str] = None              # キーワード検索（後方互換性）
    content_keyword: Optional[str] = None      # 受付内容キーワード
    status_keyword: Optional[str] = None       # 対応状況キーワード
    progress: Optional[str] = None             # 進捗フィルター
    system_type: Optional[str] = None          # システム種別フィルター
    product: Optional[str] = None              # 製品フィルター
    date_from: Optional[datetime] = None       # 開始日時
    date_to: Optional[datetime] = None         # 終了日時
    date_field: str = "reception_datetime"     # 日付フィルター対象
    include_deleted: bool = False              # 削除済みデータを含む
```

### RestoreRequest
```python
class RestoreRequest(BaseModel):
    target_ids: List[int]                      # 復元対象ID一覧
```

### StatisticsResponse
```python
class StatisticsResponse(BaseModel):
    total_records: int                         # 全体件数
    active_records: int                        # 有効件数
    deleted_records: int                       # 削除済み件数
```

## エラーレスポンス

HTTPステータス500でエラーが発生した場合：
```json
{
  "detail": "エラーメッセージ"
}
```

## 認証
現在の実装では認証は不要です。