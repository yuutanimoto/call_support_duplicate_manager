# 重複検出機能とフィルター統合実装計画

## 1. 要件定義

### 1.1 UI変更要件
- **重複検出UIの移動**: 右下 → 左サイドバー最下部
- **統合インターフェース**: フィルター条件設定と重複検出を一つの操作フローに統合

### 1.2 機能統合要件
- **フィルター適用重複検出**: 左サイドバーの全フィルター条件を適用した状態で重複検出実行
- **検索結果の絞り込み**: フィルター条件に合致するデータのみから重複を検出

### 1.3 対象フィルター条件
```
受付内容キーワード (content_keyword)
対応状況キーワード (status_keyword)
進捗 (progress)
システム種別 (system_type)
製品 (product)
受付日時範囲 (date_from, date_to)
削除済み表示フラグ (include_deleted)
```

### 1.4 重複検出タイプ
```
完全一致: 受付内容 + 対応状況の組み合わせで重複検出
受付内容: 受付内容のみで重複検出
対応状況: 対応状況のみで重複検出
```

## 2. 技術仕様

### 2.1 UI変更

#### 現在の構造
```html
<!-- 右下 -->
<section class="operation-section">
    重複データ検出: 
    <select id="duplicate-type-select">
        <option value="exact">完全一致</option>
        <option value="content">受付内容</option>
        <option value="status">対応状況</option>
    </select>
    <button id="detect-duplicates-btn" class="btn btn-primary">検出実行</button>
</section>
```

#### 改善後の構造
```html
<!-- 左サイドバー最下部 -->
<section class="filter-section">
    <!-- 既存フィルター... -->
    
    <!-- 新規追加: 重複検出セクション -->
    <div class="duplicate-detection-section">
        <h3>重複データ検出</h3>
        <div class="form-group">
            <label for="duplicate-type-select">検出タイプ:</label>
            <select id="duplicate-type-select">
                <option value="exact">完全一致</option>
                <option value="content">受付内容</option>
                <option value="status">対応状況</option>
            </select>
        </div>
        <button id="detect-duplicates-btn" class="btn btn-warning">重複検出実行</button>
    </div>
</section>
```

### 2.2 機能統合ロジック

#### JavaScript修正
```javascript
// 現在の実装
async detectDuplicates() {
    const duplicateType = document.getElementById("duplicate-type-select").value;
    const filters = this.getAllFilters(); // 空のフィルターまたは基本条件のみ
    // 重複検出API呼び出し
}

// 改善後の実装
async detectDuplicates() {
    const duplicateType = document.getElementById("duplicate-type-select").value;
    const filters = this.getAllFilters(); // 現在の全フィルター条件を取得
    
    console.log("重複検出実行 - フィルター条件:", filters);
    console.log("重複検出タイプ:", duplicateType);
    
    // フィルター条件を適用した重複検出API呼び出し
    await this.performDuplicateDetection(duplicateType, filters);
}
```

### 2.3 API仕様

#### 重複検出APIのフィルター対応
```python
# 現在のAPI: 基本的なフィルターのみ対応
@router.post("/detect-duplicates")
async def detect_duplicates(
    duplicate_type: str,
    filters: Optional[FilterRequest] = None
)

# 改善: 全フィルター条件に対応（既存のFilterRequestを活用）
```

#### DuplicateServiceの修正
```python
# 改善前: 限定的なフィルター適用
def detect_duplicates(duplicate_type: str, filters: Optional[FilterRequest] = None):
    # 基本的なフィルター条件のみ適用

# 改善後: 全フィルター条件適用
def detect_duplicates(duplicate_type: str, filters: Optional[FilterRequest] = None):
    # DataService.build_filter_conditions()を活用
    # content_keyword, status_keyword, progress, system_type, product, 
    # date_from, date_to, include_deletedを全て適用
```

## 3. 実装手順

### Phase 1: UI移動とスタイル調整
1. **HTML構造変更**
   - 右下の重複検出セクションを削除
   - 左サイドバー最下部に重複検出セクション追加

2. **CSS調整**
   - `.duplicate-detection-section` スタイル追加
   - 左サイドバー内での適切な配置とスペーシング

### Phase 2: JavaScript統合ロジック
1. **イベントリスナー移動**
   - 重複検出ボタンのイベントハンドラー確認

2. **フィルター統合**
   - `detectDuplicates()` メソッドで `getAllFilters()` の結果を活用
   - 重複検出時にフィルター条件をログ出力（デバッグ用）

### Phase 3: バックエンド確認
1. **DuplicateService検証**
   - 既存のフィルター適用が正しく動作するか確認
   - content_keyword, status_keyword対応状況の確認

2. **テスト実施**
   - 各フィルター条件と重複検出タイプの組み合わせテスト

## 4. 期待される効果

### 4.1 ユーザビリティ向上
- **操作の統合化**: フィルター設定 → 重複検出が一つの流れで実行可能
- **UI配置の合理化**: 関連機能が左サイドバーに集約

### 4.2 機能性向上
- **精密な重複検出**: 特定条件下でのみ重複検出を実行
- **効率的な重複管理**: 大量データから条件に合致するレコードのみ検出

### 4.3 運用効率向上
- **段階的絞り込み**: フィルター → 重複検出 → 操作の効率的なワークフロー
- **作業の焦点化**: 関心のあるデータセットのみでの重複処理

## 5. 実装例

### 5.1 使用シナリオ例
```
1. 左サイドバーでフィルター設定:
   - 受付内容キーワード: "エラー"
   - 進捗: "調査中"
   - 受付日時: 2024-01-01 ~ 2024-12-31
   - 削除済みデータ: 含まない

2. 重複検出タイプ選択: "受付内容"

3. 重複検出実行
   → 上記条件に合致するデータの中から、受付内容が重複するレコードのみ検出
```

### 5.2 検出結果
```
フィルター適用結果: 1,500件
重複検出結果: 45グループ、120件の重複データ

※ 全データ（155,085件）ではなく、フィルター条件に合致した
  1,500件の中から120件の重複を検出
```

## 6. リスク対策

### 6.1 パフォーマンス
- **大量データ対応**: フィルター条件により検索対象を事前に絞り込むため、むしろパフォーマンス向上
- **インデックス活用**: 既存のフィルター最適化がそのまま適用される

### 6.2 ユーザビリティ
- **操作の複雑化**: フィルター設定が重複検出に影響することの明確な表示
- **結果の理解性**: 重複検出結果がフィルター条件下のものであることの明示

## 7. 成功指標

### 7.1 機能面
- ✅ 全フィルター条件が重複検出に正しく適用される
- ✅ 検出結果がフィルター条件に合致している
- ✅ UI操作が直感的で効率的

### 7.2 パフォーマンス面
- ✅ フィルター適用により検出処理時間が短縮
- ✅ 不要な重複検出を回避し、システム負荷軽減