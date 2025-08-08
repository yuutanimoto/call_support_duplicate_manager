# キーワード検索機能改善計画

## 1. 改善要件

### 1.1 現在の課題

#### キーワード検索の制約
- **単一キーワード**: 1つの入力欄でOR検索のみ対応
- **精度の低さ**: 受付内容と対応状況を区別できない
- **検索精度**: 細かい条件指定ができない

#### UI/UX の問題
- **操作の冗長性**: 「検索」ボタンと「フィルター実行」ボタンの重複
- **混乱しやすいUX**: 2つのボタンの使い分けが不明確
- **効率性の低さ**: 検索→フィルター→実行の複数ステップ

### 1.2 改善後の要件

#### 分離型キーワード検索
1. **受付内容キーワード**: `receptbody.rdata`を対象とした専用検索
2. **対応状況キーワード**: `execbody.execstate`を対象とした専用検索
3. **AND条件結合**: 両方入力時は AND 条件で絞り込み
4. **空欄無視**: 片方が空欄の場合はその項目を検索条件から除外

#### 統合フィルター機能
- **単一ボタン**: 「検索・フィルター実行」ボタンに統合
- **リアルタイム**: 条件変更時の即座な反映
- **包括的**: 全フィルター条件を一度に適用

## 2. 技術仕様

### 2.1 データモデル拡張

#### FilterRequest モデル修正
```python
class FilterRequest(BaseModel):
    # 既存フィールド
    progress: Optional[str] = None
    system_type: Optional[str] = None
    product: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    date_field: Optional[str] = "reception_datetime"
    duplicate_type: Optional[str] = None
    include_deleted: bool = False
    
    # 新規追加（既存keywordフィールドを分離）
    content_keyword: Optional[str] = None      # 受付内容キーワード
    status_keyword: Optional[str] = None       # 対応状況キーワード
```

### 2.2 検索ロジック修正

#### 現在のクエリ条件
```sql
-- 現在（OR検索）
(receptbody.rdata ILIKE %keyword% OR COALESCE(execbody.execstate, '') ILIKE %keyword%)
```

#### 改善後のクエリ条件
```sql
-- 改善後（AND検索 + 個別制御）
-- 受付内容キーワードが入力されている場合
AND receptbody.rdata ILIKE %content_keyword%

-- 対応状況キーワードが入力されている場合  
AND COALESCE(execbody.execstate, '') ILIKE %status_keyword%

-- 両方入力されている場合は両条件が AND で適用される
```

#### データサービス修正例
```python
def build_filter_conditions(filters: FilterRequest) -> Tuple[str, list]:
    conditions = []
    params = []

    # 受付内容キーワード検索
    if filters.content_keyword:
        conditions.append("receptbody.rdata ILIKE %s")
        params.append(f"%{filters.content_keyword}%")

    # 対応状況キーワード検索
    if filters.status_keyword:
        conditions.append("COALESCE(execbody.execstate, '') ILIKE %s")
        params.append(f"%{filters.status_keyword}%")

    # その他既存フィルター条件...
    
    return where_clause, params
```

### 2.3 API修正

#### エンドポイント更新
```python
@router.get("/reception-data", response_model=ReceptionDataResponse)
async def get_reception_data(
    # ... 既存パラメータ
    content_keyword: Optional[str] = Query(None, description="受付内容キーワード"),
    status_keyword: Optional[str] = Query(None, description="対応状況キーワード"),
    # keyword パラメータは削除
):
```

## 3. UI/UXレイアウト改善

### 3.1 現在のUIの問題点分析

#### 画面利用効率の問題
- **画面サイズ**: 1920×1080を前提とするが現在は約30%しか活用されていない
- **縦方向の無駄**: フィルター部分が縦に長すぎて画面の半分以上を占有
- **横方向の未活用**: 右側に大きな空白スペースが存在
- **情報密度の低さ**: 重要な情報（統計情報、データテーブル）が下に押し下げられている

#### 操作性の問題  
- **視線移動**: フィルター→統計→操作ボタン→テーブルの縦方向移動が多い
- **関連要素分散**: 選択状況とアクションボタンが離れている
- **重要度の逆転**: 補助的なフィルターが主要なデータ表示より目立っている

### 3.2 1920×1080対応の改善設計

#### レイアウト方針
1. **2カラムレイアウト**: 左側フィルター、右側データ・操作エリア
2. **情報の階層化**: 主要情報（データ・統計）を右上に配置
3. **関連要素の集約**: 選択・操作・統計を近い位置にまとめる
4. **スペース最適化**: 画面全体を効率的に活用

#### 改善後レイアウト（1920×1080）
```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 重複データ管理システム                                    [テーブル設定] │
├──────────────────────┬───────────────────────────────────────────────────────────┤
│【フィルター】(320px)   │【データ表示・操作エリア】(1580px)                      │
│                        │                                                          │
│ 受付内容:              │ ┌─ 統計情報 ─────────────────────────────────────────┐ │
│ [______________]       │ │全レコード: 155,085件 (有効: 148,904件/削除済み: 6,181件)│ │
│                        │ │表示中: 100件 選択中: 0件                           │ │
│ 対応状況:              │ └────────────────────────────────────────────────────┘ │
│ [______________]       │                                                          │
│                        │ ┌─ 操作ボタン ───────────────────────────────────────┐ │
│ 進捗: [▼全て]          │ │[すべて選択][すべて解除][削除(0)][復元(0)] 表示:[100▼]│ │
│ システム: [▼全て]      │ └────────────────────────────────────────────────────┘ │
│ 製品: [▼全て]          │                                                          │
│                        │ ┌─ データテーブル ──────────────────────────────────┐ │
│ 受付日時:              │ │☑ ID  │受付内容        │対応状況│進捗│...           │ │
│ [____]〜[____]         │ │☐ 123 │システムエラー  │調査中  │...│...           │ │
│                        │ │☐ 124 │データ不整合    │完了    │...│...           │ │
│ 重複タイプ:            │ │☐ 125 │接続エラー      │調査中  │...│...           │ │
│ ○全て ○完全一致       │ │  :                                               │ │
│ ○受付内容 ○対応状況   │ │  (テーブルは残り画面いっぱいに拡張)                  │ │
│                        │ │                                                      │ │
│ ☐削除済み表示          │ │                                                      │ │
│                        │ └────────────────────────────────────────────────────┘ │
│ [検索・フィルター実行]  │                                                          │
│ [クリア]               │ 重複データ検出: [完全一致▼][検出実行]                    │
│                        │                                                          │
├────────────────────────┴───────────────────────────────────────────────────────────┤
│ ステータスバー: データ読み込み中... / 最終更新: 2025-08-08 11:02                      │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 フィルター統合設計

#### 現在のUI構成
```
┌─────────────────────────────────────┐
│ キーワード: [_______________] [検索]  │
│ 進捗: [▼] システム種別: [▼] 製品: [▼] │  
│ 受付日時: [____] 〜 [____]           │
│ 重複タイプ: ○全て ○完全一致 ○内容...   │
│ □削除済みデータを表示する             │
│ [フィルター実行] [クリア]             │
└─────────────────────────────────────┘
```

#### 改善後のUI構成
```
┌─────────────────────────────────────┐
│ 受付内容: [_______________]          │
│ 対応状況: [_______________]          │ 
│ 進捗: [▼] システム種別: [▼] 製品: [▼] │
│ 受付日時: [____] 〜 [____]           │
│ 重複タイプ: ○全て ○完全一致 ○内容...   │
│ □削除済みデータを表示する             │
│ [検索・フィルター実行] [クリア]        │
└─────────────────────────────────────┘
```

### 3.2 UXフロー改善

#### 現在の操作フロー
```
1. キーワード入力 → 検索ボタン
2. 他の条件入力 → フィルター実行ボタン  
3. 条件変更 → 再度フィルター実行ボタン
```

#### 改善後の操作フロー
```
1. 全条件入力 → 検索・フィルター実行ボタン（一回で完了）
2. 条件変更 → 自動的にボタンがアクティブ化
3. Enterキー対応 → どの入力欄からでも検索実行
```

## 4. 実装計画

### 4.1 段階的実装

#### Phase 1: バックエンド修正
1. **データモデル拡張**: FilterRequest に content_keyword, status_keyword 追加
2. **サービス層修正**: build_filter_conditions の検索ロジック変更
3. **API更新**: エンドポイントパラメータの変更
4. **後方互換性**: 既存 keyword パラメータのマイグレーション対応

#### Phase 2: フロントエンド修正  
1. **HTML修正**: キーワード入力欄の分離
2. **JavaScript修正**: 検索・フィルター統合ロジック
3. **イベント統合**: 検索とフィルターボタンの統合
4. **UX改善**: Enterキー対応とリアルタイム反応

#### Phase 3: テスト・最適化
1. **機能テスト**: 新検索ロジックの動作確認
2. **パフォーマンス**: 検索クエリの最適化
3. **ユーザビリティ**: 操作性の向上確認

### 3.4 CSS Grid実装設計

#### メインレイアウト構造
```css
.main-container {
  display: grid;
  grid-template-columns: 320px 1fr;  /* 左サイドバー固定, 右メイン可変 */
  grid-template-rows: 60px 1fr 30px; /* ヘッダー, メイン, ステータス */
  height: 100vh;
  max-width: 1920px;
  margin: 0 auto;
}

.header {
  grid-column: 1 / -1;
  grid-row: 1;
}

.sidebar {
  grid-column: 1;
  grid-row: 2;
  padding: 20px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  overflow-y: auto;
}

.main-content {
  grid-column: 2;
  grid-row: 2;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  padding: 20px;
  gap: 15px;
}

.status-bar {
  grid-column: 1 / -1;
  grid-row: 3;
}
```

#### データエリア詳細設計
```css
.statistics-panel {
  background: #e3f2fd;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.action-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff3e0;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #ffb74d;
}

.table-container {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
  height: calc(100vh - 280px); /* 動的高さ計算 */
}

.duplicate-detection {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}
```

### 3.5 コンパクト化とユーザビリティ改善

#### フィルター項目の最適化
```html
<!-- コンパクトなフィルター設計 -->
<div class="filter-sidebar">
  <div class="filter-section">
    <h3>検索条件</h3>
    <div class="form-group compact">
      <label>受付内容</label>
      <input type="text" id="content-keyword" placeholder="キーワード">
    </div>
    <div class="form-group compact">
      <label>対応状況</label>
      <input type="text" id="status-keyword" placeholder="キーワード">
    </div>
  </div>
  
  <div class="filter-section">
    <h3>絞り込み</h3>
    <div class="form-group compact">
      <label>進捗</label>
      <select id="progress"><option value="">全て</option></select>
    </div>
    <!-- 他の選択項目も同様にコンパクト化 -->
  </div>
  
  <div class="filter-section">
    <h3>期間・オプション</h3>
    <!-- 日付範囲、重複タイプ、削除済み表示 -->
  </div>
  
  <div class="filter-actions">
    <button class="btn primary full-width">検索・フィルター実行</button>
    <button class="btn secondary full-width">クリア</button>
  </div>
</div>
```

#### 統計情報の視覚的改善
```html
<div class="statistics-panel">
  <div class="stats-grid">
    <div class="stat-item">
      <span class="stat-label">全レコード</span>
      <span class="stat-value">155,085</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">有効</span>
      <span class="stat-value active">148,904</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">削除済み</span>
      <span class="stat-value deleted">6,181</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">選択中</span>
      <span class="stat-value selected">0</span>
    </div>
  </div>
</div>
```

### 3.6 レスポンシブ対応

#### ブレークポイント設計
```css
/* 1920×1080 (メイン対象) */
@media (min-width: 1800px) {
  .main-container {
    grid-template-columns: 350px 1fr; /* サイドバー拡張 */
  }
}

/* 1600×900 (サブ対象) */
@media (max-width: 1799px) and (min-width: 1400px) {
  .main-container {
    grid-template-columns: 300px 1fr;
  }
}

/* 1366×768 以下 (縮小対応) */
@media (max-width: 1399px) {
  .main-container {
    grid-template-columns: 1fr;
    grid-template-rows: 60px auto 1fr 30px;
  }
  
  .sidebar {
    grid-row: 2;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .main-content {
    grid-row: 3;
  }
}
```

### 4.2 具体的な実装内容

#### HTML修正
```html
<!-- 現在 -->
<div class="form-group">
    <label for="keyword">キーワード:</label>
    <input type="text" id="keyword" placeholder="受付内容・対応状況で検索">
    <button id="search-btn" class="btn btn-primary">検索</button>
</div>

<!-- 改善後 -->
<div class="filter-row">
    <div class="form-group">
        <label for="content-keyword">受付内容:</label>
        <input type="text" id="content-keyword" placeholder="受付内容で検索">
    </div>
    <div class="form-group">
        <label for="status-keyword">対応状況:</label>
        <input type="text" id="status-keyword" placeholder="対応状況で検索">
    </div>
</div>
```

#### JavaScript修正
```javascript
// 現在の分離された処理を統合
async search() {
    // 削除：個別のキーワード処理
}

async applyFilters() {
    // 削除：個別のフィルター処理
}

// 新規：統合された検索・フィルター処理
async executeSearch() {
    const filters = this.getAllFilters(); // content_keyword, status_keyword含む
    await this.loadData(0, false);
}

getAllFilters() {
    const filters = {};
    
    // 分離されたキーワード
    const contentKeyword = document.getElementById("content-keyword").value.trim();
    const statusKeyword = document.getElementById("status-keyword").value.trim();
    
    if (contentKeyword) filters.content_keyword = contentKeyword;
    if (statusKeyword) filters.status_keyword = statusKeyword;
    
    // その他既存フィルター...
    return filters;
}
```

## 5. 期待される効果

### 5.1 検索精度の向上
- **精密検索**: 受付内容と対応状況を個別に指定可能
- **AND検索**: 複数条件での絞り込み精度向上
- **効率化**: 不要な検索結果の排除

### 5.2 操作性の改善  
- **シンプル化**: ボタンの統合により操作ステップ削減
- **直感性**: 入力→実行の分かりやすいフロー
- **応答性**: Enterキー対応による素早い検索

### 5.3 運用効率の向上
- **作業時間短縮**: 精密な検索による目的データの素早い発見
- **誤操作削減**: 明確なUI設計による操作ミスの防止
- **学習コスト削減**: 直感的な操作による習熟時間の短縮

## 6. 移行計画

### 6.1 後方互換性の確保
- **APIレベル**: 既存 keyword パラメータのフォールバック対応
- **URL互換性**: ブックマークや外部リンクの継続動作
- **段階移行**: 新旧UIの並行運用期間の設定

### 6.2 ユーザー移行支援
- **操作ガイド**: 新しい検索方法の説明資料
- **移行期間**: 十分な慣らし運用期間
- **フィードバック収集**: 実際の使用感に基づく微調整

## 7. リスク対策

### 7.1 技術リスク
- **検索性能**: 複数LIKE条件による性能劣化の可能性
- **複雑性**: フィルター条件の組み合わせ増加
- **バグ**: 新旧ロジック混在による不具合

### 7.2 対策
- **インデックス最適化**: 検索対象列のインデックス見直し  
- **クエリ分析**: EXPLAINによる実行計画の最適化
- **段階的テスト**: 小規模環境での十分な動作検証

## 8. 成功指標

### 8.1 定量的指標
- **検索精度向上**: 不適切な検索結果の削減率
- **操作時間短縮**: データ発見までの平均時間削減
- **エラー率低下**: 検索関連エラーの減少

### 8.2 定性的指標  
- **ユーザー満足度**: 操作性に関するフィードバック向上
- **学習容易性**: 新規ユーザーの習熟時間短縮
- **作業効率**: 日常業務での検索作業効率化