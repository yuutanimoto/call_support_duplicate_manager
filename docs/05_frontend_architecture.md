# フロントエンド アーキテクチャ

## 概要

フロントエンドはバニラJavaScript（ES6+）を使用したSPA（Single Page Application）として実装されています。フレームワークを使わず、軽量で高速な動作を実現しています。

## ファイル構成

### HTML テンプレート
- **`app/templates/index.html`**: メインのHTMLテンプレート
  - セマンティックHTML構造
  - アクセシビリティ対応
  - レスポンシブレイアウト

### CSS
- **`app/static/css/style.css`**: 統合スタイルシート
  - CSS Grid/Flexbox レイアウト
  - CSS Variables（カスタムプロパティ）
  - モバイルファーストデザイン

### JavaScript
- **`app/static/js/app.js`**: メインアプリケーション
- **`app/static/js/table-manager.js`**: テーブル管理機能
- **`app/static/js/filter-manager.js`**: フィルター機能  
- **`app/static/js/delete-manager.js`**: 削除・復元操作機能

## JavaScript アーキテクチャ

### 主要クラス: DuplicateManagementApp

メインアプリケーションクラスで、以下の責任を持ちます：

#### 状態管理
```javascript
class DuplicateManagementApp {
    constructor() {
        this.currentData = [];          // 現在表示中のデータ
        this.currentFilters = {};       // 適用中のフィルター条件
        this.selectedIds = new Set();   // 選択されたレコードID
        this.totalCount = 0;           // 総件数
        this.currentOffset = 0;        // 現在のオフセット
        this.hasMore = false;          // 追加データの有無
        this.isLoading = false;        // ローディング状態
        this.metadata = null;          // メタデータ
        this.isDuplicateMode = false;  // 重複検出モード状態
        this.statistics = {            // 統計情報
            total_records: 0,
            active_records: 0,
            deleted_records: 0
        };
        this.showDeletedData = false;  // 削除済みデータ表示フラグ
    }
}
```

#### 主要メソッド
- **`init()`**: アプリケーション初期化
- **`loadMetadata()`**: マスターデータ取得
- **`loadData()`**: データ取得とページネーション
- **`renderTable()`**: テーブル描画
- **`detectDuplicates()`**: 重複データ検出
- **`deleteSelected()`**: 選択データ削除
- **`restoreSelected()`**: 選択データ復元
- **`updateStatistics()`**: 統計情報更新

### 管理クラス

#### TableManager
- テーブル表示の詳細制御
- 列の表示/非表示設定
- ソート機能
- カスタマイズ設定

#### FilterManager  
- フィルター条件の管理
- 日付範囲検索
- キーワード検索
- マスターデータフィルター

#### DeleteManager
- 削除・復元操作の制御
- バッチ削除・復元機能
- 削除・復元確認ダイアログ
- 操作結果のフィードバック表示
- エラーハンドリング

## 主要機能実装

### 1. 分離型キーワード検索

```javascript
// 受付内容キーワードと対応状況キーワードを分離
getFilters() {
    const filters = {};
    
    // 分離型キーワード検索（推奨）
    const contentKeyword = document.getElementById("content-keyword")?.value;
    const statusKeyword = document.getElementById("status-keyword")?.value;
    
    if (contentKeyword) filters.content_keyword = contentKeyword;
    if (statusKeyword) filters.status_keyword = statusKeyword;
    
    // 後方互換性のための統合キーワード
    const keyword = document.getElementById("keyword")?.value;
    if (keyword && !contentKeyword && !statusKeyword) {
        filters.keyword = keyword;
    }
    
    // 削除済みデータ表示制御
    filters.include_deleted = this.showDeletedData;
    
    return filters;
}
```

### 2. 統計情報表示

```javascript
updateStatistics(data) {
    if (data.statistics) {
        this.statistics = data.statistics;
        
        // 統計情報をUIに反映
        const statsElements = {
            'total-records': data.statistics.total_records,
            'active-records': data.statistics.active_records,
            'deleted-records': data.statistics.deleted_records
        };
        
        Object.entries(statsElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value.toLocaleString();
        });
    }
}
```

### 3. データ取得とページネーション

```javascript
async loadData(offset = 0, append = false) {
    // パラメータ構築
    const params = new URLSearchParams({
        offset: offset.toString(),
        limit: this.getPageSize().toString(),
        sort_by: "reception_datetime",
        sort_order: "desc",
        ...this.currentFilters,
    });

    // API呼び出し
    const response = await fetch(`/api/reception-data?${params}`);
    const data = await response.json();

    // データ更新
    if (append) {
        this.currentData = [...this.currentData, ...data.data];
    } else {
        this.currentData = data.data;
        this.selectedIds.clear();
    }
}
```

### 2. 自動スクロール読み込み

```javascript
setupAutoScroll() {
    const tableContainer = document.getElementById("table-container");
    
    tableContainer.addEventListener("scroll", () => {
        // 重複モード中は自動読み込みを無効化
        if (this.isDuplicateMode || !this.hasMore || this.isLoading) return;

        const { scrollTop, scrollHeight, clientHeight } = tableContainer;
        const threshold = 200;

        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            this.loadMoreData();
        }
    });
}
```

### 3. 重複データ検出

```javascript
async detectDuplicates() {
    const duplicateType = document.getElementById("duplicate-type-select").value;
    const filters = this.getFilters();

    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/duplicates/${duplicateType}?${params}`);
    const duplicateData = await response.json();

    // 重複データを平坦化して表示
    const flattenedData = [];
    duplicateData.duplicates.forEach(group => {
        group.records.forEach(record => {
            record.duplicate_group = group.group_id;
            flattenedData.push(record);
        });
    });

    this.currentData = flattenedData;
    this.isDuplicateMode = true;  // 重複モードに切り替え
    this.renderTable();
}
```

### 5. データ復元機能

```javascript
async restoreSelected() {
    if (this.selectedIds.size === 0) {
        this.showToast("復元するデータを選択してください", "warning");
        return;
    }

    if (!confirm(`選択した${this.selectedIds.size}件のデータを復元しますか？`)) {
        return;
    }

    const requestData = {
        target_ids: Array.from(this.selectedIds)
    };

    try {
        const response = await fetch('/api/restore-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        
        if (result.success) {
            this.showToast(`${result.restored_count}件のデータを復元しました`, "success");
            await this.loadData(); // データ再読み込み
        } else {
            this.showToast("復元に失敗しました", "error");
        }
    } catch (error) {
        this.showToast(`エラー: ${error.message}`, "error");
    }
}
```

### 6. テーブル動的描画

```javascript
renderTable() {
    const tableHeader = document.getElementById("table-header");
    const tableBody = document.getElementById("table-body");

    // 列ヘッダー作成
    const columns = [
        { id: "id", name: "ID" },
        { id: "content", name: "受付内容" },
        { id: "status", name: "対応状況" },
        // ... その他の列
    ];

    // データ行を作成
    this.currentData.forEach(record => {
        const row = document.createElement("tr");
        
        // チェックボックス
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = record.id;
        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                this.selectedIds.add(record.id);
            } else {
                this.selectedIds.delete(record.id);
            }
        });

        // データセル
        columns.forEach(column => {
            const cell = document.createElement("td");
            let value = record[column.id];
            
            // 日付フォーマット
            if (column.id.includes("datetime") && value) {
                value = new Date(value).toLocaleString("ja-JP");
            }
            
            // 削除済みデータの表示制御
            if (column.id === "reception_moddt") {
                if (value) {
                    cell.classList.add("deleted-data");
                    cell.title = `削除日時: ${value}`;
                    value = "削除済";
                } else {
                    value = "有効";
                }
            }
            
            cell.textContent = value || "";
            row.appendChild(cell);
        });
    });
}
```

## レスポンシブデザイン

### ブレークポイント
- **デスクトップ**: 1200px以上（推奨）
- **タブレット**: 768px - 1199px（基本対応）
- **モバイル**: 768px未満（制限付き対応）

### レイアウト特徴
- **CSS Grid**: メインレイアウト構築
- **Flexbox**: 個別コンポーネントの配置
- **固定列**: チェックボックス列の固定
- **仮想スクロール**: 大量データ対応

## パフォーマンス最適化

### データ取得最適化
- **ページング**: 100-500件ずつ取得
- **遅延読み込み**: 自動スクロール対応
- **キャッシュ**: メタデータのクライアントキャッシュ

### DOM操作最適化
- **DocumentFragment**: 大量DOM操作の最適化
- **Event Delegation**: イベントリスナーの効率化
- **仮想スクロール**: 表示領域のみレンダリング

### メモリ管理
- **データクリア**: 不要なデータの定期削除
- **イベントリスナー**: 適切なクリーンアップ
- **WeakSet/WeakMap**: 適切な参照管理

## エラーハンドリング

### ユーザーフレンドリーなエラー表示
```javascript
showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        ${message}
        <button class="toast-close">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    // 自動削除タイマー
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 5000);
}
```

### APIエラー処理
- **ネットワークエラー**: 再試行機能
- **サーバーエラー**: 適切なエラーメッセージ表示
- **バリデーションエラー**: フィールド固有のエラー表示

## セキュリティ考慮事項

### XSS対策
- **textContent使用**: HTMLエスケープ
- **CSP対応**: Content Security Policy
- **サニタイズ**: ユーザー入力の適切な処理

### データ保護
- **機密情報**: ローカルストレージ回避
- **セッション管理**: 適切なライフサイクル管理
- **削除データ**: 物理削除ではなく論理削除で安全性を確保

## ブラウザ対応

### 対応ブラウザ
- **Chrome**: 80+ 
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

### 必要なJavaScript機能
- **ES6 Classes**
- **Async/Await**
- **Fetch API**
- **CSS Grid/Flexbox**

## 開発・デバッグ

### 開発者向け機能
- **コンソールログ**: 詳細なデバッグ情報
- **エラートラッキング**: 包括的なエラーログ
- **パフォーマンス監視**: 処理時間測定

### デバッグコマンド
```javascript
// ブラウザコンソールでのデバッグ
window.app.currentData          // 現在のデータ確認
window.app.selectedIds          // 選択状態確認  
window.app.isDuplicateMode      // モード状態確認
window.app.statistics           // 統計情報確認
window.app.showDeletedData      // 削除データ表示状態確認
window.app.currentFilters       // 現在のフィルター条件確認
```