# 統計情報表示のUX改善提案

## 1. 現在の問題点

### 1.1 情報提示の不一致
- **通常データ表示**: 固定統計パネルで件数表示
- **重複データ表示**: トーストポップアップで一時的に結果表示
- **混乱要因**: 同じ画面で異なる表示方法を使用

### 1.2 統計情報の非同期
- 重複検出時に統計パネルが更新されない
- 表示中データと統計情報の不整合

### 1.3 モード切り替えの不明確性
- 通常表示モード vs 重複データ表示モードの区別が不明確
- 現在のデータ表示状態をユーザーが把握しにくい

## 2. 改善案

### 案1: 統計パネル統合方式（推奨）

#### 2.1 統計パネルのモード対応
```html
<!-- 通常モード -->
<div class="statistics-panel">
    <div class="mode-indicator normal-mode">
        <span class="mode-label">📊 通常データ表示</span>
    </div>
    <div class="statistics-display">
        全レコード: 155,085件 (有効: 148,904件 / 削除済み: 6,181件)
        | 表示中: 100件 | 選択中: 0件
    </div>
</div>

<!-- 重複データモード -->
<div class="statistics-panel duplicate-mode">
    <div class="mode-indicator">
        <span class="mode-label">🔍 重複データ表示 - 完全一致</span>
        <button class="back-to-normal">通常表示に戻る</button>
    </div>
    <div class="statistics-display">
        重複データ: 45グループ、120件 | フィルター適用結果から検出
        | 表示中: 120件 | 選択中: 0件
    </div>
</div>
```

#### 2.2 JavaScript実装
```javascript
// 表示モードの管理
this.displayMode = 'normal'; // 'normal' or 'duplicate'

// 重複検出時
async detectDuplicates() {
    // ... 既存コード ...
    
    this.displayMode = 'duplicate';
    this.duplicateType = duplicateType;
    this.duplicateData = duplicateData;
    
    this.displayDuplicates(duplicateData);
    this.updateStatisticsForDuplicateMode(duplicateData);
    
    // トーストは削除（統計パネルで表現）
}

// 統計表示の統一
updateStatisticsForDuplicateMode(duplicateData) {
    this.updateModeIndicator('duplicate', duplicateType);
    
    // 統計パネル内容を重複データ用に更新
    document.getElementById("current-count").textContent = duplicateData.total_duplicates;
    document.getElementById("total-all").textContent = `${duplicateData.total_groups}グループ`;
    
    // 追加情報表示
    this.showDuplicateStatistics(duplicateData);
}

// 通常表示に戻る
returnToNormalMode() {
    this.displayMode = 'normal';
    this.loadData(0, false); // 通常データを再読み込み
}
```

### 案2: 拡張統計パネル方式

#### 2.1 統計パネル拡張
```html
<div class="statistics-panel">
    <!-- 基本統計 -->
    <div class="basic-stats">
        全レコード: 155,085件 (有効: 148,904件 / 削除済み: 6,181件)
    </div>
    
    <!-- 表示状態統計 -->
    <div class="display-stats">
        <div class="normal-display active">
            📊 通常表示: 100件 | 選択中: 0件
        </div>
        <div class="duplicate-display hidden">
            🔍 重複データ: 45グループ、120件 | 選択中: 0件
        </div>
    </div>
    
    <!-- 切り替えボタン -->
    <div class="mode-switch hidden">
        <button id="back-to-normal">通常表示に戻る</button>
    </div>
</div>
```

### 案3: ダッシュボード方式

#### 3.1 情報の階層化
```html
<div class="info-dashboard">
    <!-- データベース全体統計（常時表示） -->
    <div class="global-stats">
        データベース全体: 155,085件 (有効: 148,904件 / 削除済み: 6,181件)
    </div>
    
    <!-- 現在の表示状態（動的変更） -->
    <div class="current-view">
        <div class="view-type">📊 通常データ表示</div>
        <div class="view-stats">フィルター適用後: 100件 | 選択中: 0件</div>
    </div>
    
    <!-- 重複検出結果（必要時のみ表示） -->
    <div class="duplicate-results hidden">
        <div class="result-summary">🔍 重複検出結果: 45グループ、120件</div>
        <div class="result-actions">
            <button>通常表示に戻る</button>
            <button>重複データをエクスポート</button>
        </div>
    </div>
</div>
```

## 3. 推奨実装：案1（統計パネル統合方式）

### 3.1 実装理由
1. **一貫性**: 情報表示場所の統一
2. **明確性**: 現在のモードが一目で分かる
3. **簡潔性**: トーストとパネルの重複排除
4. **操作性**: 直感的なモード切り替え

### 3.2 実装ステップ
1. **HTMLテンプレート修正**: モード表示エリア追加
2. **CSS追加**: モード別スタイリング
3. **JavaScript修正**: 
   - displayMode状態管理追加
   - updateStatisticsForDuplicateMode()実装
   - returnToNormalMode()実装
4. **UXテスト**: モード切り替えの動作確認

### 3.3 期待される改善効果

#### ユーザーエクスペリエンス
- ✅ 情報提示の一貫性向上
- ✅ 現在の表示状態の明確化
- ✅ 混乱のない直感的な操作

#### 技術面
- ✅ コードの一貫性向上
- ✅ 重複する表示ロジックの統合
- ✅ 保守性の向上

#### 運用面
- ✅ ユーザートレーニングコストの削減
- ✅ 操作ミスの防止
- ✅ 効率的なデータ管理ワークフロー

## 4. 実装詳細

### 4.1 モード管理クラス設計
```javascript
class DisplayModeManager {
    constructor(app) {
        this.app = app;
        this.currentMode = 'normal';
        this.duplicateData = null;
    }
    
    switchToNormalMode() {
        this.currentMode = 'normal';
        this.updateUI();
        this.app.loadData(0, false);
    }
    
    switchToDuplicateMode(duplicateType, duplicateData) {
        this.currentMode = 'duplicate';
        this.duplicateData = duplicateData;
        this.updateUI();
    }
    
    updateUI() {
        this.updateModeIndicator();
        this.updateStatistics();
        this.updateActionButtons();
    }
}
```

### 4.2 CSS設計
```css
.statistics-panel {
    transition: all 0.3s ease;
}

.mode-indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 8px;
}

.mode-indicator.normal-mode {
    background-color: #e3f2fd;
    border-left: 4px solid #2196f3;
}

.mode-indicator.duplicate-mode {
    background-color: #fff3e0;
    border-left: 4px solid #ff9800;
}

.mode-label {
    font-weight: 500;
    font-size: 0.9em;
}

.back-to-normal {
    padding: 4px 12px;
    border: 1px solid #ff9800;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
}
```

この改善により、ユーザーは常に現在のデータ表示状態を把握でき、一貫した方法で情報を確認できるようになります。