# データベーススキーマ

## データベース構成

このシステムは既存のPostgreSQLデータベース「mcsystem」に接続し、受信データと実行データを管理します。

### 主要テーブル

#### 1. recepthead（受信ヘッダーテーブル）
受信データのヘッダー情報を格納するメインテーブル

| 列名 | データ型 | 説明 | 備考 |
|---|---|---|---|
| extentid | integer | レコードID | PRIMARY KEY, システム内の一意ID |
| receptno | varchar | 受付番号 | 受信データの識別子 |
| calldt | timestamp | 受付日時 | 受信した日時 |
| receptmoddt | timestamp | 削除フラグ日時 | NULL=有効、値あり=論理削除済み |
| receptempcd | varchar | 受付担当者コード | m_empテーブルと結合 |

**重要な制約**:
- extentid IS NOT NULL AND extentid != 0 で有効レコードを判定
- receptmoddt IS NULL で未削除レコードを判定
- calldt >= '2015-01-01 00:00:00' でデータ範囲を限定

#### 2. receptbody（受信ボディテーブル）
受信データの詳細内容を格納

| 列名 | データ型 | 説明 | 備考 |
|---|---|---|---|
| receptno | varchar | 受付番号 | recepthead.receptno と結合 |
| rdata | text | 受付内容 | 重複検出の主要フィールド |
| moddt | timestamp | 更新日時 | 最終更新タイムスタンプ |

#### 3. exechead（実行ヘッダーテーブル）
実行・対応に関するヘッダー情報

| 列名 | データ型 | 説明 | 備考 |
|---|---|---|---|
| receptno | varchar | 受付番号 | recepthead.receptno と結合 |
| condition | varchar | 条件コード | m_ctitemと結合して進捗表示 |
| stype | varchar | システム種別コード | m_ctitemと結合 |
| producttype | varchar | 製品コード | m_ctitemと結合 |

#### 4. execbody（実行ボディテーブル）
実行・対応の詳細結果を格納

| 列名 | データ型 | 説明 | 備考 |
|---|---|---|---|
| receptno | varchar | 受付番号 | recepthead.receptno と結合 |
| execstate | varchar | 対応状況 | 重複検出の主要フィールド |
| execresult | text | 結果 | 対応結果の詳細 |
| execinfo | text | レポート | 対応に関する追加情報 |

#### 5. m_ctitem（マスターアイテムテーブル）
各種コードのマスターデータ

| 列名 | データ型 | 説明 | 備考 |
|---|---|---|---|
| itemcd | varchar | アイテムコード | 各種テーブルと結合するキー |
| itemname | varchar | アイテム名 | 表示用の名称 |

**用途**:
- condition → 進捗マスター
- stype → システム種別マスター  
- producttype → 製品マスター

#### 6. m_emp（従業員マスターテーブル）
担当者情報のマスター

| 列名 | データ型 | 説明 | 備考 |
|---|---|---|---|
| empcd | varchar | 従業員コード | recepthead.receptempcd と結合 |

## 主要なJOINパターン

### 基本データ取得クエリ
```sql
SELECT
    recepthead.extentid AS id,
    receptbody.rdata AS content,
    COALESCE(execbody.execstate, '') AS status,
    COALESCE(execbody.execresult, '') AS result,
    COALESCE(execbody.execinfo, '') AS report,
    cond_item.itemname AS progress,
    stype_item.itemname AS system_type,
    prod_item.itemname AS product,
    recepthead.receptmoddt AT TIME ZONE 'Asia/Tokyo' AS reception_moddt,
    recepthead.calldt AT TIME ZONE 'Asia/Tokyo' AS reception_datetime,
    COALESCE(receptbody.moddt, recepthead.calldt) AT TIME ZONE 'Asia/Tokyo' AS update_datetime
FROM recepthead
LEFT JOIN receptbody ON recepthead.receptno = receptbody.receptno
LEFT JOIN exechead ON recepthead.receptno = exechead.receptno
LEFT JOIN execbody ON recepthead.receptno = execbody.receptno
LEFT JOIN m_ctitem AS cond_item ON exechead.condition = cond_item.itemcd
LEFT JOIN m_ctitem AS stype_item ON exechead.stype = stype_item.itemcd
LEFT JOIN m_ctitem AS prod_item ON exechead.producttype = prod_item.itemcd
LEFT JOIN m_emp ON recepthead.receptempcd = m_emp.empcd
WHERE recepthead.extentid IS NOT NULL
AND recepthead.extentid != 0
AND (
    recepthead.calldt >= '2015-01-01 00:00:00'
    OR receptbody.moddt >= '2015-01-01 00:00:00'
)
-- 削除済みデータを含む場合はinclude_deleted=trueの時のみ表示
-- AND recepthead.receptmoddt IS NULL
```

## 重複検出ロジック

### 1. 完全一致重複（exact）
```sql
PARTITION BY receptbody.rdata, COALESCE(execbody.execstate, '')
```
- 条件: `recepthead.receptmoddt IS NULL`（未削除のみ）

### 2. 受付内容重複（content）
```sql
PARTITION BY receptbody.rdata
```
- 条件: `receptbody.rdata IS NOT NULL AND receptbody.rdata != ''`

### 3. 対応状況重複（status）
```sql
PARTITION BY COALESCE(execbody.execstate, '')
```
- 条件: `COALESCE(execbody.execstate, '') != ''`

## 重複検出ロジックの詳細

### キーワード検索機能

#### 分離型キーワード検索（推奨）
```sql
-- 受付内容キーワード
WHERE receptbody.rdata ILIKE '%キーワード%'

-- 対応状況キーワード  
WHERE COALESCE(execbody.execstate, '') ILIKE '%キーワード%'
```

#### 統合キーワード検索（後方互換性）
```sql
WHERE (
    receptbody.rdata ILIKE '%キーワード%'
    OR COALESCE(execbody.execstate, '') ILIKE '%キーワード%'
)
```

### 削除・復元機能

#### 論理削除
```sql
UPDATE recepthead
SET receptmoddt = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo'
WHERE extentid = ANY(%s)
AND receptmoddt IS NULL
```

#### データ復元
```sql
UPDATE recepthead
SET receptmoddt = NULL
WHERE extentid = ANY(%s)
AND receptmoddt IS NOT NULL
```

## データ整合性とパフォーマンス考慮事項

### インデックス推奨
効率的なクエリ実行のため、以下のインデックスが推奨されます：
- `recepthead.extentid` （PRIMARY KEY）
- `recepthead.receptno`
- `recepthead.calldt`
- `recepthead.receptmoddt`
- `receptbody.receptno`
- `receptbody.rdata` （キーワード検索用）
- `execbody.receptno`
- `execbody.execstate` （キーワード検索用）

### タイムゾーン処理
すべての日時フィールドは `AT TIME ZONE 'Asia/Tokyo'` で日本時間に変換されます。

### 論理削除と復元
- 物理削除は禁止：データの完全性を保つ
- 論理削除：`recepthead.receptmoddt` に削除日時を設定
- データ復元：`receptmoddt` を NULL にリセットして復元

### データ範囲制限
パフォーマンスのため、2015年1月1日以降のデータのみを対象とします：
```sql
WHERE (
    recepthead.calldt >= '2015-01-01 00:00:00'
    OR receptbody.moddt >= '2015-01-01 00:00:00'
)
```

### 統計情報の算出
```sql
-- 有効データ数（削除済み除外）
WHERE recepthead.receptmoddt IS NULL

-- 全データ数（削除済み含む）
WHERE 1=1  -- 削除フラグのチェックなし

-- 削除済み数 = 全データ数 - 有効データ数
```