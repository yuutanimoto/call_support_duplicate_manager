# システム構成図・ユーザーマニュアル 実装ガイド

## 実装概要

このガイドでは、重複データ管理システムにシステム構成図とユーザーマニュアルを追加する具体的な実装手順を説明します。

## 実装アーキテクチャ

### ファイル構成
```
app/
├── templates/
│   ├── index.html              # メイン画面（更新）
│   ├── system-diagram.html     # システム構成図（新規）
│   └── user-manual.html        # ユーザーマニュアル（新規）
├── static/
│   ├── css/
│   │   ├── style.css          # 共通スタイル（更新）
│   │   ├── diagram.css        # 構成図専用（新規）
│   │   └── manual.css         # マニュアル専用（新規）
│   ├── js/
│   │   ├── app.js            # メインアプリ（更新）
│   │   ├── diagram.js        # 構成図制御（新規）
│   │   ├── manual.js         # マニュアル制御（新規）
│   │   └── navigation.js     # ナビゲーション（新規）
│   └── images/
│       └── diagrams/         # 構成図画像（新規）
└── main.py                   # ルート追加（更新）
```

## Phase 1: 基盤整備

### 1.1 FastAPIルート追加

```python
# app/main.py に追加

@app.get("/system-diagram", response_class=HTMLResponse)
async def system_diagram(request: Request):
    """システム構成図画面"""
    return templates.TemplateResponse("system-diagram.html", {"request": request})

@app.get("/user-manual", response_class=HTMLResponse)
async def user_manual(request: Request):
    """ユーザーマニュアル画面"""
    return templates.TemplateResponse("user-manual.html", {"request": request})
```

### 1.2 共通ナビゲーションCSS

```css
/* app/static/css/style.css に追加 */

/* ナビゲーション */
.main-navigation {
    background-color: var(--primary-color);
    padding: 1rem 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
}

.nav-brand {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    text-decoration: none;
}

.nav-links {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 2rem;
}

.nav-links a {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.nav-links a:hover {
    background-color: rgba(255,255,255,0.2);
}

.nav-toggle {
    display: none;
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
}

/* レスポンシブナビゲーション */
@media (max-width: 768px) {
    .nav-toggle {
        display: block;
    }
    
    .nav-links {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background-color: var(--primary-color);
        flex-direction: column;
        padding: 1rem 0;
    }
    
    .nav-links.active {
        display: flex;
    }
}
```

### 1.3 共通ナビゲーションJavaScript

```javascript
// app/static/js/navigation.js（新規作成）

class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileToggle();
        this.setupActiveStates();
        this.setupBreadcrumbs();
    }

    setupMobileToggle() {
        const toggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (toggle && navLinks) {
            toggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });

            // 画面サイズ変更時のクリーンアップ
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    navLinks.classList.remove('active');
                }
            });
        }
    }

    setupActiveStates() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');

        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }

    setupBreadcrumbs() {
        const breadcrumbsContainer = document.querySelector('.breadcrumbs');
        if (!breadcrumbsContainer) return;

        const pathMap = {
            '/': 'ホーム',
            '/system-diagram': 'システム構成図',
            '/user-manual': 'ユーザーマニュアル'
        };

        const currentPath = window.location.pathname;
        const currentTitle = pathMap[currentPath] || 'ページ';

        breadcrumbsContainer.innerHTML = `
            <a href="/">ホーム</a>
            ${currentPath !== '/' ? `<span class="separator">></span><span class="current">${currentTitle}</span>` : ''}
        `;
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    new NavigationManager();
});
```

## Phase 2: システム構成図実装

### 2.1 システム構成図HTML

```html
<!-- app/templates/system-diagram.html（新規作成） -->
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>システム構成図 - 重複データ管理システム</title>
    <link rel="stylesheet" href="{{ url_for('static', path='/css/style.css') }}">
    <link rel="stylesheet" href="{{ url_for('static', path='/css/diagram.css') }}">
</head>
<body>
    <nav class="main-navigation">
        <div class="nav-container">
            <a href="/" class="nav-brand">重複データ管理システム</a>
            <button class="nav-toggle">☰</button>
            <ul class="nav-links">
                <li><a href="/">データ管理</a></li>
                <li><a href="/system-diagram">システム構成図</a></li>
                <li><a href="/user-manual">ユーザーマニュアル</a></li>
            </ul>
        </div>
    </nav>

    <div class="breadcrumbs"></div>

    <main class="diagram-container">
        <header class="page-header">
            <h1>システム構成図</h1>
            <p>重複データ管理システムのアーキテクチャと技術スタックを可視化します</p>
        </header>

        <div class="diagram-controls">
            <button class="control-btn" id="zoom-in">拡大</button>
            <button class="control-btn" id="zoom-out">縮小</button>
            <button class="control-btn" id="reset-view">リセット</button>
            <button class="control-btn" id="fullscreen">フルスクリーン</button>
        </div>

        <div class="diagram-wrapper" id="diagram-wrapper">
            <svg class="architecture-diagram" id="architecture-diagram" viewBox="0 0 1200 800">
                <!-- フロントエンド層 -->
                <g class="layer frontend-layer" data-layer="frontend">
                    <rect x="50" y="50" width="1100" height="150" rx="10" class="layer-bg frontend-bg"/>
                    <text x="600" y="35" text-anchor="middle" class="layer-title">フロントエンド層</text>
                    
                    <g class="component" data-component="html">
                        <rect x="100" y="80" width="200" height="80" rx="5" class="component-box"/>
                        <text x="200" y="110" text-anchor="middle" class="component-title">HTML5</text>
                        <text x="200" y="130" text-anchor="middle" class="component-desc">セマンティックマークアップ</text>
                    </g>
                    
                    <g class="component" data-component="css">
                        <rect x="350" y="80" width="200" height="80" rx="5" class="component-box"/>
                        <text x="450" y="110" text-anchor="middle" class="component-title">CSS3</text>
                        <text x="450" y="130" text-anchor="middle" class="component-desc">Grid/Flexbox レイアウト</text>
                    </g>
                    
                    <g class="component" data-component="javascript">
                        <rect x="600" y="80" width="200" height="80" rx="5" class="component-box"/>
                        <text x="700" y="110" text-anchor="middle" class="component-title">Vanilla JavaScript</text>
                        <text x="700" y="130" text-anchor="middle" class="component-desc">ES6+ モジュール</text>
                    </g>
                    
                    <g class="component" data-component="spa">
                        <rect x="850" y="80" width="200" height="80" rx="5" class="component-box"/>
                        <text x="950" y="110" text-anchor="middle" class="component-title">SPA</text>
                        <text x="950" y="130" text-anchor="middle" class="component-desc">シングルページアプリ</text>
                    </g>
                </g>

                <!-- API層 -->
                <g class="layer api-layer" data-layer="api">
                    <rect x="50" y="250" width="1100" height="150" rx="10" class="layer-bg api-bg"/>
                    <text x="600" y="235" text-anchor="middle" class="layer-title">API層</text>
                    
                    <g class="component" data-component="fastapi">
                        <rect x="150" y="280" width="250" height="80" rx="5" class="component-box"/>
                        <text x="275" y="310" text-anchor="middle" class="component-title">FastAPI</text>
                        <text x="275" y="330" text-anchor="middle" class="component-desc">RESTful API フレームワーク</text>
                    </g>
                    
                    <g class="component" data-component="uvicorn">
                        <rect x="450" y="280" width="200" height="80" rx="5" class="component-box"/>
                        <text x="550" y="310" text-anchor="middle" class="component-title">Uvicorn</text>
                        <text x="550" y="330" text-anchor="middle" class="component-desc">ASGI Webサーバー</text>
                    </g>
                    
                    <g class="component" data-component="pydantic">
                        <rect x="700" y="280" width="200" height="80" rx="5" class="component-box"/>
                        <text x="800" y="310" text-anchor="middle" class="component-title">Pydantic</text>
                        <text x="800" y="330" text-anchor="middle" class="component-desc">データバリデーション</text>
                    </g>
                </g>

                <!-- サービス層 -->
                <g class="layer service-layer" data-layer="service">
                    <rect x="50" y="450" width="1100" height="150" rx="10" class="layer-bg service-bg"/>
                    <text x="600" y="435" text-anchor="middle" class="layer-title">サービス層</text>
                    
                    <g class="component" data-component="data-service">
                        <rect x="100" y="480" width="180" height="80" rx="5" class="component-box"/>
                        <text x="190" y="510" text-anchor="middle" class="component-title">DataService</text>
                        <text x="190" y="530" text-anchor="middle" class="component-desc">データ取得</text>
                    </g>
                    
                    <g class="component" data-component="duplicate-service">
                        <rect x="320" y="480" width="180" height="80" rx="5" class="component-box"/>
                        <text x="410" y="510" text-anchor="middle" class="component-title">DuplicateService</text>
                        <text x="410" y="530" text-anchor="middle" class="component-desc">重複検出</text>
                    </g>
                    
                    <g class="component" data-component="delete-service">
                        <rect x="540" y="480" width="180" height="80" rx="5" class="component-box"/>
                        <text x="630" y="510" text-anchor="middle" class="component-title">DeleteService</text>
                        <text x="630" y="530" text-anchor="middle" class="component-desc">データ削除</text>
                    </g>
                    
                    <g class="component" data-component="restore-service">
                        <rect x="760" y="480" width="180" height="80" rx="5" class="component-box"/>
                        <text x="850" y="510" text-anchor="middle" class="component-title">RestoreService</text>
                        <text x="850" y="530" text-anchor="middle" class="component-desc">データ復元</text>
                    </g>
                </g>

                <!-- データベース層 -->
                <g class="layer database-layer" data-layer="database">
                    <rect x="50" y="650" width="1100" height="100" rx="10" class="layer-bg database-bg"/>
                    <text x="600" y="635" text-anchor="middle" class="layer-title">データベース層</text>
                    
                    <g class="component" data-component="postgresql">
                        <rect x="300" y="670" width="300" height="60" rx="5" class="component-box"/>
                        <text x="450" y="695" text-anchor="middle" class="component-title">PostgreSQL</text>
                        <text x="450" y="715" text-anchor="middle" class="component-desc">リレーショナルデータベース</text>
                    </g>
                    
                    <g class="component" data-component="psycopg2">
                        <rect x="650" y="670" width="200" height="60" rx="5" class="component-box"/>
                        <text x="750" y="695" text-anchor="middle" class="component-title">psycopg2</text>
                        <text x="750" y="715" text-anchor="middle" class="component-desc">DB接続ライブラリ</text>
                    </g>
                </g>

                <!-- データフロー矢印 -->
                <g class="data-flow">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" class="arrow"/>
                        </marker>
                    </defs>
                    
                    <!-- フロントエンド → API -->
                    <path d="M 600 200 L 600 250" class="flow-arrow" marker-end="url(#arrowhead)"/>
                    <text x="620" y="225" class="flow-label">HTTP Request</text>
                    
                    <!-- API → サービス -->
                    <path d="M 600 400 L 600 450" class="flow-arrow" marker-end="url(#arrowhead)"/>
                    <text x="620" y="425" class="flow-label">Function Call</text>
                    
                    <!-- サービス → データベース -->
                    <path d="M 600 600 L 600 650" class="flow-arrow" marker-end="url(#arrowhead)"/>
                    <text x="620" y="625" class="flow-label">SQL Query</text>
                </g>
            </svg>
        </div>

        <!-- 詳細情報モーダル -->
        <div class="modal" id="detail-modal">
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <div class="modal-body" id="modal-body">
                    <!-- 動的コンテンツ -->
                </div>
            </div>
        </div>
    </main>

    <script src="{{ url_for('static', path='/js/navigation.js') }}"></script>
    <script src="{{ url_for('static', path='/js/diagram.js') }}"></script>
</body>
</html>
```

### 2.2 システム構成図CSS

```css
/* app/static/css/diagram.css（新規作成） */

/* システム構成図専用スタイル */
.diagram-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
}

.page-header {
    text-align: center;
    margin-bottom: 2rem;
}

.page-header h1 {
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.page-header p {
    color: var(--text-secondary);
    font-size: 1.1rem;
}

/* 制御ボタン */
.diagram-controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
}

.control-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.control-btn:hover {
    background: var(--primary-hover);
}

/* 構成図コンテナ */
.diagram-wrapper {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    overflow: auto;
    position: relative;
    min-height: 600px;
}

.architecture-diagram {
    width: 100%;
    height: auto;
    transition: transform 0.3s ease;
    cursor: grab;
}

.architecture-diagram:active {
    cursor: grabbing;
}

/* 層スタイル */
.layer-bg {
    fill: #f8f9fa;
    stroke: #dee2e6;
    stroke-width: 2;
}

.frontend-bg {
    fill: #e3f2fd;
    stroke: #2196f3;
}

.api-bg {
    fill: #f3e5f5;
    stroke: #9c27b0;
}

.service-bg {
    fill: #e8f5e8;
    stroke: #4caf50;
}

.database-bg {
    fill: #fff3e0;
    stroke: #ff9800;
}

/* 層タイトル */
.layer-title {
    font-size: 18px;
    font-weight: bold;
    fill: #333;
}

/* コンポーネントスタイル */
.component-box {
    fill: white;
    stroke: #666;
    stroke-width: 1;
    transition: all 0.3s ease;
    cursor: pointer;
}

.component:hover .component-box {
    stroke: var(--primary-color);
    stroke-width: 2;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.component-title {
    font-size: 14px;
    font-weight: bold;
    fill: #333;
    pointer-events: none;
}

.component-desc {
    font-size: 11px;
    fill: #666;
    pointer-events: none;
}

/* データフロー */
.flow-arrow {
    stroke: var(--primary-color);
    stroke-width: 2;
    fill: none;
}

.arrow {
    fill: var(--primary-color);
}

.flow-label {
    font-size: 12px;
    fill: #666;
    text-anchor: middle;
}

/* モーダル */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
}

.modal.active {
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
}

.modal-close {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.modal-body {
    padding: 2rem;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    .diagram-container {
        padding: 1rem;
    }
    
    .diagram-controls {
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .control-btn {
        flex: 1;
        min-width: 100px;
    }
    
    .diagram-wrapper {
        padding: 0.5rem;
    }
    
    .architecture-diagram {
        min-width: 800px;
    }
}

/* アクセシビリティ */
.component[tabindex="0"]:focus .component-box {
    stroke: var(--primary-color);
    stroke-width: 3;
    outline: 2px solid var(--primary-color);
}

/* アニメーション */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
}

.layer.highlighted {
    animation: pulse 1s ease-in-out;
}
```

### 2.3 システム構成図JavaScript

```javascript
// app/static/js/diagram.js（新規作成）

class SystemDiagramManager {
    constructor() {
        this.diagram = document.getElementById('architecture-diagram');
        this.wrapper = document.getElementById('diagram-wrapper');
        this.modal = document.getElementById('detail-modal');
        this.modalBody = document.getElementById('modal-body');
        
        this.scale = 1;
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.translateX = 0;
        this.translateY = 0;
        
        this.componentDetails = this.initComponentDetails();
        this.init();
    }
    
    init() {
        this.setupControls();
        this.setupInteractions();
        this.setupKeyboardNavigation();
    }
    
    initComponentDetails() {
        return {
            html: {
                title: 'HTML5',
                description: 'セマンティックなマークアップによる構造定義',
                technologies: ['HTML5', 'Semantic Elements', 'Web Standards'],
                features: [
                    'アクセシビリティ対応',
                    'SEO最適化',
                    'レスポンシブ対応',
                    'プログレッシブエンハンスメント'
                ]
            },
            css: {
                title: 'CSS3',
                description: 'モダンCSS技術による高度なレイアウト',
                technologies: ['CSS Grid', 'Flexbox', 'CSS Variables', 'Media Queries'],
                features: [
                    'レスポンシブデザイン',
                    'アニメーション効果',
                    'モバイルファースト',
                    'コンポーネント指向'
                ]
            },
            javascript: {
                title: 'Vanilla JavaScript',
                description: 'フレームワーク非依存の軽量JavaScript実装',
                technologies: ['ES6+', 'Modules', 'Async/Await', 'Fetch API'],
                features: [
                    'モジュール化設計',
                    'イベント駆動',
                    '非同期処理',
                    'エラーハンドリング'
                ]
            },
            spa: {
                title: 'SPA (Single Page Application)',
                description: '単一ページによる高速ユーザー体験',
                technologies: ['History API', 'AJAX', 'Dynamic DOM'],
                features: [
                    '高速ページ遷移',
                    '状態管理',
                    'ルーティング',
                    'プログレッシブローディング'
                ]
            },
            fastapi: {
                title: 'FastAPI',
                description: '高性能なPython Webフレームワーク',
                technologies: ['Python 3.8+', 'Starlette', 'OpenAPI', 'JSON Schema'],
                features: [
                    '自動API文書生成',
                    'データバリデーション',
                    '型ヒント活用',
                    '高性能非同期処理'
                ]
            },
            uvicorn: {
                title: 'Uvicorn',
                description: 'ASGIサーバーによる高速HTTP処理',
                technologies: ['ASGI', 'uvloop', 'HTTP/1.1', 'WebSocket'],
                features: [
                    '高性能非同期処理',
                    'ホットリロード',
                    'SSL/TLS対応',
                    'プロセス管理'
                ]
            },
            pydantic: {
                title: 'Pydantic',
                description: 'Python型ヒントによるデータバリデーション',
                technologies: ['Type Hints', 'JSON Schema', 'Data Classes'],
                features: [
                    '厳密な型チェック',
                    '自動変換',
                    'カスタムバリデーション',
                    'JSONスキーマ生成'
                ]
            },
            'data-service': {
                title: 'DataService',
                description: 'データ取得・フィルタリング機能',
                technologies: ['Python', 'SQL', 'Pagination'],
                features: [
                    'ページネーション',
                    '動的フィルタリング',
                    'ソート機能',
                    '統計情報算出'
                ]
            },
            'duplicate-service': {
                title: 'DuplicateService',
                description: '重複データ検出アルゴリズム',
                technologies: ['SQL Window Functions', 'Pattern Matching'],
                features: [
                    '完全一致検出',
                    '部分一致検出',
                    'グループ化',
                    'パフォーマンス最適化'
                ]
            },
            'delete-service': {
                title: 'DeleteService',
                description: '安全なデータ削除機能',
                technologies: ['Logical Delete', 'Transaction'],
                features: [
                    '論理削除',
                    'バッチ処理',
                    'ロールバック対応',
                    '操作ログ記録'
                ]
            },
            'restore-service': {
                title: 'RestoreService',
                description: '削除データの復元機能',
                technologies: ['Data Recovery', 'Validation'],
                features: [
                    'データ復元',
                    '整合性チェック',
                    'バッチ復元',
                    '操作履歴'
                ]
            },
            postgresql: {
                title: 'PostgreSQL',
                description: '高機能オープンソースデータベース',
                technologies: ['SQL', 'ACID', 'Indexing', 'JSON Support'],
                features: [
                    'トランザクション処理',
                    '複雑クエリ対応',
                    'パフォーマンス最適化',
                    'データ整合性保証'
                ]
            },
            psycopg2: {
                title: 'psycopg2',
                description: 'PostgreSQL用Pythonアダプター',
                technologies: ['Python DB-API 2.0', 'Connection Pool'],
                features: [
                    'コネクション管理',
                    'パラメータ化クエリ',
                    'トランザクション制御',
                    'エラーハンドリング'
                ]
            }
        };
    }
    
    setupControls() {
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        const resetView = document.getElementById('reset-view');
        const fullscreen = document.getElementById('fullscreen');
        
        zoomIn?.addEventListener('click', () => this.zoomIn());
        zoomOut?.addEventListener('click', () => this.zoomOut());
        resetView?.addEventListener('click', () => this.resetView());
        fullscreen?.addEventListener('click', () => this.toggleFullscreen());
    }
    
    setupInteractions() {
        // コンポーネントクリック
        const components = document.querySelectorAll('.component');
        components.forEach(component => {
            component.addEventListener('click', (e) => {
                const componentId = component.dataset.component;
                this.showComponentDetails(componentId);
            });
            
            // キーボードアクセシビリティ
            component.setAttribute('tabindex', '0');
            component.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const componentId = component.dataset.component;
                    this.showComponentDetails(componentId);
                }
            });
        });
        
        // パン＆ズーム
        this.setupPanZoom();
        
        // モーダル制御
        this.setupModal();
    }
    
    setupPanZoom() {
        this.wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.scale *= delta;
            this.scale = Math.max(0.5, Math.min(3, this.scale));
            this.updateTransform();
        });
        
        this.diagram.addEventListener('mousedown', (e) => {
            this.isPanning = true;
            this.startX = e.clientX - this.translateX;
            this.startY = e.clientY - this.translateY;
            this.diagram.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isPanning) return;
            
            this.translateX = e.clientX - this.startX;
            this.translateY = e.clientY - this.startY;
            this.updateTransform();
        });
        
        document.addEventListener('mouseup', () => {
            this.isPanning = false;
            this.diagram.style.cursor = 'grab';
        });
    }
    
    setupModal() {
        const closeBtn = document.querySelector('.modal-close');
        closeBtn?.addEventListener('click', () => this.hideModal());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '=':
                    case '+':
                        e.preventDefault();
                        this.zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        this.zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        this.resetView();
                        break;
                }
            }
        });
    }
    
    zoomIn() {
        this.scale = Math.min(3, this.scale * 1.2);
        this.updateTransform();
    }
    
    zoomOut() {
        this.scale = Math.max(0.5, this.scale * 0.8);
        this.updateTransform();
    }
    
    resetView() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.wrapper.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    updateTransform() {
        this.diagram.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
    
    showComponentDetails(componentId) {
        const details = this.componentDetails[componentId];
        if (!details) return;
        
        this.modalBody.innerHTML = `
            <h2>${details.title}</h2>
            <p class="component-description">${details.description}</p>
            
            <h3>技術スタック</h3>
            <ul class="tech-list">
                ${details.technologies.map(tech => `<li>${tech}</li>`).join('')}
            </ul>
            
            <h3>主要機能</h3>
            <ul class="feature-list">
                ${details.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        `;
        
        this.showModal();
    }
    
    showModal() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // フォーカス管理
        const firstFocusable = this.modal.querySelector('button, [tabindex="0"]');
        firstFocusable?.focus();
    }
    
    hideModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    new SystemDiagramManager();
});
```

## Phase 3: ユーザーマニュアル実装

### 3.1 ユーザーマニュアルHTML

```html
<!-- app/templates/user-manual.html（新規作成） -->
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ユーザーマニュアル - 重複データ管理システム</title>
    <link rel="stylesheet" href="{{ url_for('static', path='/css/style.css') }}">
    <link rel="stylesheet" href="{{ url_for('static', path='/css/manual.css') }}">
</head>
<body>
    <nav class="main-navigation">
        <div class="nav-container">
            <a href="/" class="nav-brand">重複データ管理システム</a>
            <button class="nav-toggle">☰</button>
            <ul class="nav-links">
                <li><a href="/">データ管理</a></li>
                <li><a href="/system-diagram">システム構成図</a></li>
                <li><a href="/user-manual">ユーザーマニュアル</a></li>
            </ul>
        </div>
    </nav>

    <div class="breadcrumbs"></div>

    <div class="manual-container">
        <!-- サイドバー -->
        <aside class="manual-sidebar">
            <div class="sidebar-header">
                <h2>目次</h2>
                <button class="sidebar-toggle">≡</button>
            </div>
            
            <div class="search-box">
                <input type="text" id="manual-search" placeholder="マニュアルを検索...">
                <button class="search-btn">🔍</button>
            </div>
            
            <nav class="manual-toc" id="manual-toc">
                <ul>
                    <li><a href="#overview" data-section="overview">システム概要</a></li>
                    <li><a href="#getting-started" data-section="getting-started">はじめに</a></li>
                    <li><a href="#basic-operations" data-section="basic-operations">基本操作</a>
                        <ul>
                            <li><a href="#data-display" data-section="data-display">データ表示</a></li>
                            <li><a href="#filtering" data-section="filtering">フィルタリング</a></li>
                            <li><a href="#sorting" data-section="sorting">ソート</a></li>
                        </ul>
                    </li>
                    <li><a href="#duplicate-detection" data-section="duplicate-detection">重複検出</a>
                        <ul>
                            <li><a href="#exact-duplicates" data-section="exact-duplicates">完全一致重複</a></li>
                            <li><a href="#content-duplicates" data-section="content-duplicates">受付内容重複</a></li>
                            <li><a href="#status-duplicates" data-section="status-duplicates">対応状況重複</a></li>
                        </ul>
                    </li>
                    <li><a href="#data-management" data-section="data-management">データ管理</a>
                        <ul>
                            <li><a href="#delete-data" data-section="delete-data">データ削除</a></li>
                            <li><a href="#restore-data" data-section="restore-data">データ復元</a></li>
                            <li><a href="#statistics" data-section="statistics">統計情報</a></li>
                        </ul>
                    </li>
                    <li><a href="#advanced-features" data-section="advanced-features">高度な機能</a></li>
                    <li><a href="#troubleshooting" data-section="troubleshooting">トラブルシューティング</a></li>
                    <li><a href="#faq" data-section="faq">よくある質問</a></li>
                </ul>
            </nav>
            
            <div class="progress-indicator">
                <div class="progress-bar" id="reading-progress"></div>
                <span class="progress-text">読み進行度: <span id="progress-percentage">0%</span></span>
            </div>
        </aside>

        <!-- メインコンテンツ -->
        <main class="manual-content" id="manual-content">
            <header class="content-header">
                <h1>重複データ管理システム ユーザーマニュアル</h1>
                <div class="manual-actions">
                    <button class="action-btn" id="print-manual">印刷</button>
                    <button class="action-btn" id="export-pdf">PDF出力</button>
                    <button class="action-btn" id="bookmark-section">ブックマーク</button>
                </div>
            </header>

            <!-- システム概要 -->
            <section id="overview" class="manual-section">
                <h2>システム概要</h2>
                <p>重複データ管理システムは、PostgreSQLデータベースから取得した受信データの重複を検出・管理するWebアプリケーションです。</p>
                
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>重複検出</h3>
                        <p>3種類の重複タイプで精密なデータ分析</p>
                    </div>
                    <div class="feature-card">
                        <h3>安全な削除</h3>
                        <p>論理削除による安全なデータ管理</p>
                    </div>
                    <div class="feature-card">
                        <h3>データ復元</h3>
                        <p>削除済みデータの簡単復元</p>
                    </div>
                    <div class="feature-card">
                        <h3>統計情報</h3>
                        <p>リアルタイム統計とダッシュボード</p>
                    </div>
                </div>
            </section>

            <!-- はじめに -->
            <section id="getting-started" class="manual-section">
                <h2>はじめに</h2>
                
                <h3>システム要件</h3>
                <ul>
                    <li>対応ブラウザ: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+</li>
                    <li>推奨解像度: 1200px以上（PC環境）</li>
                    <li>JavaScript有効化必須</li>
                </ul>
                
                <h3>画面構成</h3>
                <div class="screenshot-container">
                    <img src="/static/images/manual/main-screen.png" alt="メイン画面" class="screenshot">
                    <div class="screenshot-caption">メイン画面の構成</div>
                </div>
                
                <div class="ui-explanation">
                    <h4>主要UI要素</h4>
                    <ol>
                        <li><strong>ナビゲーションバー</strong>: システム内の移動</li>
                        <li><strong>フィルターパネル</strong>: データ絞り込み条件</li>
                        <li><strong>データテーブル</strong>: 受信データの一覧表示</li>
                        <li><strong>操作ボタン</strong>: 削除・復元・重複検出</li>
                        <li><strong>統計情報</strong>: データ統計の表示</li>
                    </ol>
                </div>
            </section>

            <!-- 基本操作 -->
            <section id="basic-operations" class="manual-section">
                <h2>基本操作</h2>
                
                <h3 id="data-display">データ表示</h3>
                <p>システムにアクセスすると、受信データが一覧表示されます。</p>
                
                <div class="step-guide">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>ページアクセス</h4>
                            <p>ブラウザでシステムURLにアクセスします。</p>
                            <code>http://localhost:8000</code>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>データ確認</h4>
                            <p>画面中央のテーブルに受信データが表示されます。</p>
                            <div class="tip">💡 初期状態では最新100件が表示されます</div>
                        </div>
                    </div>
                </div>

                <h3 id="filtering">フィルタリング</h3>
                <p>条件を指定してデータを絞り込むことができます。</p>
                
                <div class="filter-types">
                    <h4>フィルタータイプ</h4>
                    
                    <div class="filter-type">
                        <h5>キーワード検索</h5>
                        <ul>
                            <li><strong>受付内容キーワード</strong>: 受付内容のみを検索</li>
                            <li><strong>対応状況キーワード</strong>: 対応状況のみを検索</li>
                            <li><strong>統合キーワード</strong>: 両方を同時検索（後方互換性）</li>
                        </ul>
                    </div>
                    
                    <div class="filter-type">
                        <h5>マスターフィルター</h5>
                        <ul>
                            <li><strong>進捗</strong>: 処理進捗による絞り込み</li>
                            <li><strong>システム種別</strong>: システムタイプによる絞り込み</li>
                            <li><strong>製品</strong>: 製品種別による絞り込み</li>
                        </ul>
                    </div>
                    
                    <div class="filter-type">
                        <h5>日付フィルター</h5>
                        <ul>
                            <li><strong>受付日時</strong>: データ受付日時範囲</li>
                            <li><strong>更新日時</strong>: データ更新日時範囲</li>
                            <li><strong>削除日時</strong>: データ削除日時範囲</li>
                        </ul>
                    </div>
                </div>

                <h3 id="sorting">ソート</h3>
                <p>列ヘッダーをクリックしてデータをソートできます。</p>
                
                <div class="sort-demo">
                    <h4>ソート操作</h4>
                    <ol>
                        <li>ソートしたい列のヘッダーをクリック</li>
                        <li>▲（昇順）または▼（降順）アイコンが表示</li>
                        <li>再度クリックでソート順が逆転</li>
                    </ol>
                </div>
            </section>

            <!-- 重複検出 -->
            <section id="duplicate-detection" class="manual-section">
                <h2>重複検出</h2>
                <p>システムでは3種類の重複検出アルゴリズムを提供しています。</p>
                
                <h3 id="exact-duplicates">完全一致重複</h3>
                <div class="duplicate-explanation">
                    <h4>検出条件</h4>
                    <p>受付内容（rdata）と対応状況（execstate）の両方が完全に一致するデータを検出します。</p>
                    
                    <h4>使用場面</h4>
                    <ul>
                        <li>全く同じ問い合わせの重複受付</li>
                        <li>システム障害による重複登録</li>
                        <li>オペレーターミスによる重複入力</li>
                    </ul>
                    
                    <div class="usage-example">
                        <h4>操作手順</h4>
                        <ol>
                            <li>「重複タイプ」で「完全一致」を選択</li>
                            <li>必要に応じてフィルター条件を設定</li>
                            <li>「重複検出」ボタンをクリック</li>
                            <li>検出結果がグループ化されて表示</li>
                        </ol>
                    </div>
                </div>

                <h3 id="content-duplicates">受付内容重複</h3>
                <div class="duplicate-explanation">
                    <h4>検出条件</h4>
                    <p>受付内容（rdata）のみが一致するデータを検出します。対応状況は考慮しません。</p>
                    
                    <h4>使用場面</h4>
                    <ul>
                        <li>同じ内容で異なる対応状況のデータ</li>
                        <li>処理進捗が異なる類似案件</li>
                        <li>対応者が違う同一問題</li>
                    </ul>
                </div>

                <h3 id="status-duplicates">対応状況重複</h3>
                <div class="duplicate-explanation">
                    <h4>検出条件</h4>
                    <p>対応状況（execstate）のみが一致するデータを検出します。受付内容は考慮しません。</p>
                    
                    <h4>使用場面</h4>
                    <ul>
                        <li>同じ対応パターンのデータ分析</li>
                        <li>対応方法の統計分析</li>
                        <li>処理フローの見直し検討</li>
                    </ul>
                </div>
            </section>

            <!-- データ管理 -->
            <section id="data-management" class="manual-section">
                <h2>データ管理</h2>
                
                <h3 id="delete-data">データ削除</h3>
                <p>システムでは安全な論理削除を採用しています。</p>
                
                <div class="warning-box">
                    <h4>⚠️ 重要事項</h4>
                    <p>このシステムでは物理削除は行いません。すべて論理削除（削除フラグ設定）で管理されるため、誤削除時も復元可能です。</p>
                </div>
                
                <div class="delete-guide">
                    <h4>削除手順</h4>
                    <ol>
                        <li>削除対象のデータにチェックを入れる</li>
                        <li>「選択データ削除」ボタンをクリック</li>
                        <li>確認ダイアログで「削除」を選択</li>
                        <li>削除完了メッセージを確認</li>
                    </ol>
                    
                    <h4>バッチ削除</h4>
                    <p>複数のデータを一度に削除することも可能です。</p>
                    <ul>
                        <li>「全選択」チェックボックスで一括選択</li>
                        <li>個別チェックで部分選択</li>
                        <li>フィルター条件での一括削除</li>
                    </ul>
                </div>

                <h3 id="restore-data">データ復元</h3>
                <p>削除済みデータを元の状態に戻すことができます。</p>
                
                <div class="restore-guide">
                    <h4>復元手順</h4>
                    <ol>
                        <li>「削除済みデータを表示」をチェック</li>
                        <li>復元対象のデータを選択</li>
                        <li>「選択データ復元」ボタンをクリック</li>
                        <li>確認ダイアログで「復元」を選択</li>
                    </ol>
                    
                    <div class="info-box">
                        <h4>💡 ポイント</h4>
                        <p>復元されたデータは削除前の状態に完全復帰し、すべての情報が保持されます。</p>
                    </div>
                </div>

                <h3 id="statistics">統計情報</h3>
                <p>システムではリアルタイムでデータ統計を表示します。</p>
                
                <div class="statistics-explanation">
                    <h4>統計項目</h4>
                    <ul>
                        <li><strong>全体データ数</strong>: システム内の総データ件数</li>
                        <li><strong>有効データ数</strong>: 削除されていないアクティブなデータ件数</li>
                        <li><strong>削除済みデータ数</strong>: 論理削除されたデータ件数</li>
                    </ul>
                    
                    <h4>統計の活用</h4>
                    <ul>
                        <li>データ管理状況の把握</li>
                        <li>削除・復元操作の効果確認</li>
                        <li>システム利用状況の監視</li>
                    </ul>
                </div>
            </section>

            <!-- 高度な機能 -->
            <section id="advanced-features" class="manual-section">
                <h2>高度な機能</h2>
                
                <h3>キーボードショートカット</h3>
                <div class="shortcut-table">
                    <table>
                        <thead>
                            <tr>
                                <th>機能</th>
                                <th>ショートカット</th>
                                <th>説明</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>検索フォーカス</td>
                                <td>Ctrl + F</td>
                                <td>検索ボックスにフォーカス</td>
                            </tr>
                            <tr>
                                <td>全選択</td>
                                <td>Ctrl + A</td>
                                <td>表示中の全データを選択</td>
                            </tr>
                            <tr>
                                <td>削除実行</td>
                                <td>Delete</td>
                                <td>選択データの削除</td>
                            </tr>
                            <tr>
                                <td>復元実行</td>
                                <td>Ctrl + Z</td>
                                <td>選択データの復元</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>URL パラメーター</h3>
                <p>URLパラメーターで直接フィルター条件を指定できます。</p>
                
                <div class="url-examples">
                    <h4>例</h4>
                    <ul>
                        <li><code>?keyword=エラー</code> - キーワード検索</li>
                        <li><code>?progress=完了</code> - 進捗フィルター</li>
                        <li><code>?include_deleted=true</code> - 削除済み表示</li>
                    </ul>
                </div>
            </section>

            <!-- トラブルシューティング -->
            <section id="troubleshooting" class="manual-section">
                <h2>トラブルシューティング</h2>
                
                <div class="troubleshoot-item">
                    <h3>データが表示されない</h3>
                    <div class="problem-solution">
                        <h4>原因</h4>
                        <ul>
                            <li>フィルター条件が厳しすぎる</li>
                            <li>データベース接続エラー</li>
                            <li>ブラウザのJavaScriptが無効</li>
                        </ul>
                        
                        <h4>解決方法</h4>
                        <ol>
                            <li>フィルター条件をリセット</li>
                            <li>ブラウザを再読み込み（F5）</li>
                            <li>JavaScript有効化を確認</li>
                            <li>管理者に連絡</li>
                        </ol>
                    </div>
                </div>

                <div class="troubleshoot-item">
                    <h3>重複検出が動作しない</h3>
                    <div class="problem-solution">
                        <h4>原因</h4>
                        <ul>
                            <li>検索対象データが存在しない</li>
                            <li>ネットワーク接続問題</li>
                        </ul>
                        
                        <h4>解決方法</h4>
                        <ol>
                            <li>フィルター条件を緩和</li>
                            <li>インターネット接続確認</li>
                            <li>別の重複タイプを試行</li>
                        </ol>
                    </div>
                </div>

                <div class="troubleshoot-item">
                    <h3>削除・復元が失敗する</h3>
                    <div class="problem-solution">
                        <h4>原因</h4>
                        <ul>
                            <li>データベース権限不足</li>
                            <li>対象データが存在しない</li>
                            <li>セッションタイムアウト</li>
                        </ul>
                        
                        <h4>解決方法</h4>
                        <ol>
                            <li>ページを再読み込み</li>
                            <li>データ選択状態を確認</li>
                            <li>管理者に権限確認を依頼</li>
                        </ol>
                    </div>
                </div>
            </section>

            <!-- よくある質問 -->
            <section id="faq" class="manual-section">
                <h2>よくある質問（FAQ）</h2>
                
                <div class="faq-item">
                    <h3 class="faq-question">Q: 削除したデータは完全に消えますか？</h3>
                    <div class="faq-answer">
                        <p>A: いいえ。このシステムでは論理削除を採用しているため、削除されたデータは「削除フラグ」が設定されるだけで、実際のデータは保持されます。必要に応じて復元可能です。</p>
                    </div>
                </div>

                <div class="faq-item">
                    <h3 class="faq-question">Q: 重複検出の精度はどの程度ですか？</h3>
                    <div class="faq-answer">
                        <p>A: 完全一致重複は100%の精度です。受付内容重複と対応状況重複は、それぞれの項目で文字列が完全に一致する場合のみ検出されます。部分一致や類似検出は含まれません。</p>
                    </div>
                </div>

                <div class="faq-item">
                    <h3 class="faq-question">Q: 大量データの処理時間はどの程度かかりますか？</h3>
                    <div class="faq-answer">
                        <p>A: データ量やサーバー性能により異なりますが、一般的に：</p>
                        <ul>
                            <li>1,000件以下: 1-2秒</li>
                            <li>10,000件以下: 5-10秒</li>
                            <li>100,000件以上: 30秒-数分</li>
                        </ul>
                        <p>処理中は画面にローディング表示されます。</p>
                    </div>
                </div>

                <div class="faq-item">
                    <h3 class="faq-question">Q: モバイルデバイスでも利用できますか？</h3>
                    <div class="faq-answer">
                        <p>A: 基本的な機能はモバイルでも利用可能ですが、PC環境（1200px以上）での利用を強く推奨します。特に大量データの処理や複雑な操作はPC環境で行ってください。</p>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <script src="{{ url_for('static', path='/js/navigation.js') }}"></script>
    <script src="{{ url_for('static', path='/js/manual.js') }}"></script>
</body>
</html>
```

この実装ガイドに従って、段階的にシステム構成図とユーザーマニュアルを実装できます。続いて残りのCSS、JavaScript、TOPページ統合を実装していきます。