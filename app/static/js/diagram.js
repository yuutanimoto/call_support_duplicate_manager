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
                technologies: ['HTML5', 'Semantic Elements', 'Web Standards', 'ARIA Support'],
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
                    'コンポーネント指向設計'
                ]
            },
            javascript: {
                title: 'Vanilla JavaScript',
                description: 'フレームワーク非依存の軽量JavaScript実装',
                technologies: ['ES6+', 'Modules', 'Async/Await', 'Fetch API'],
                features: [
                    'モジュール化設計',
                    'イベント駆動アーキテクチャ',
                    '非同期処理対応',
                    '包括的エラーハンドリング'
                ]
            },
            spa: {
                title: 'SPA (Single Page Application)',
                description: '単一ページによる高速ユーザー体験',
                technologies: ['History API', 'AJAX', 'Dynamic DOM', 'State Management'],
                features: [
                    '高速ページ遷移',
                    'クライアント側状態管理',
                    '動的ルーティング',
                    'プログレッシブローディング'
                ]
            },
            fastapi: {
                title: 'FastAPI',
                description: '高性能なPython Webフレームワーク',
                technologies: ['Python 3.8+', 'Starlette', 'OpenAPI 3', 'JSON Schema'],
                features: [
                    '自動API文書生成',
                    'データバリデーション',
                    '型ヒント完全活用',
                    '高性能非同期処理'
                ]
            },
            uvicorn: {
                title: 'Uvicorn',
                description: 'ASGIサーバーによる高速HTTP処理',
                technologies: ['ASGI', 'uvloop', 'HTTP/1.1', 'WebSocket'],
                features: [
                    '高性能非同期処理',
                    'ホットリロード対応',
                    'SSL/TLS対応',
                    'マルチプロセス管理'
                ]
            },
            pydantic: {
                title: 'Pydantic',
                description: 'Python型ヒントによるデータバリデーション',
                technologies: ['Type Hints', 'JSON Schema', 'Data Classes', 'Validators'],
                features: [
                    '厳密な型チェック',
                    '自動データ変換',
                    'カスタムバリデーション',
                    'JSONスキーマ生成'
                ]
            },
            'data-service': {
                title: 'DataService',
                description: 'データ取得・フィルタリング機能を提供',
                technologies: ['Python', 'SQL', 'Pagination', 'Dynamic Filtering'],
                features: [
                    '効率的ページネーション',
                    '動的フィルタリング',
                    '多条件ソート機能',
                    'リアルタイム統計算出'
                ]
            },
            'duplicate-service': {
                title: 'DuplicateService',
                description: '重複データ検出アルゴリズムを実装',
                technologies: ['SQL Window Functions', 'Pattern Matching', 'Data Grouping'],
                features: [
                    '完全一致重複検出',
                    '部分一致重複検出',
                    'インテリジェントグループ化',
                    'パフォーマンス最適化'
                ]
            },
            'delete-service': {
                title: 'DeleteService',
                description: '安全なデータ削除機能を提供',
                technologies: ['Logical Delete', 'Transaction Management', 'Audit Log'],
                features: [
                    '論理削除実装',
                    'バッチ処理対応',
                    'ロールバック機能',
                    '操作ログ自動記録'
                ]
            },
            'restore-service': {
                title: 'RestoreService',
                description: '削除データの復元機能を提供',
                technologies: ['Data Recovery', 'Integrity Check', 'Batch Processing'],
                features: [
                    '安全なデータ復元',
                    '整合性自動チェック',
                    'バッチ復元機能',
                    '詳細な操作履歴'
                ]
            },
            postgresql: {
                title: 'PostgreSQL',
                description: '高機能オープンソースリレーショナルデータベース',
                technologies: ['SQL Standard', 'ACID Compliance', 'Advanced Indexing', 'JSON Support'],
                features: [
                    'ACID準拠トランザクション',
                    '複雑クエリ高速実行',
                    '高度なパフォーマンス最適化',
                    '強固なデータ整合性保証'
                ]
            },
            psycopg2: {
                title: 'psycopg2',
                description: 'PostgreSQL用の高性能Pythonアダプター',
                technologies: ['Python DB-API 2.0', 'Connection Pooling', 'Binary Protocol'],
                features: [
                    '効率的コネクション管理',
                    'パラメータ化クエリ対応',
                    'トランザクション完全制御',
                    '包括的エラーハンドリング'
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
                e.stopPropagation();
                const componentId = component.dataset.component;
                this.showComponentDetails(componentId);
            });
            
            // キーボードアクセシビリティ
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
        // ホイールズーム
        this.wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.scale *= delta;
            this.scale = Math.max(0.5, Math.min(3, this.scale));
            this.updateTransform();
        });
        
        // ドラッグパン
        this.diagram.addEventListener('mousedown', (e) => {
            // コンポーネント上でのクリックは無視
            if (e.target.closest('.component')) return;
            
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
        
        // タッチ操作対応
        this.setupTouchGestures();
    }
    
    setupTouchGestures() {
        let lastTouchDistance = 0;
        let lastTouchX = 0;
        let lastTouchY = 0;
        
        this.wrapper.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // ピンチズーム開始
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            } else if (e.touches.length === 1) {
                // パン開始
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            }
        });
        
        this.wrapper.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 2) {
                // ピンチズーム
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                if (lastTouchDistance > 0) {
                    const delta = currentDistance / lastTouchDistance;
                    this.scale *= delta;
                    this.scale = Math.max(0.5, Math.min(3, this.scale));
                    this.updateTransform();
                }
                lastTouchDistance = currentDistance;
            } else if (e.touches.length === 1) {
                // パン
                const deltaX = e.touches[0].clientX - lastTouchX;
                const deltaY = e.touches[0].clientY - lastTouchY;
                
                this.translateX += deltaX;
                this.translateY += deltaY;
                this.updateTransform();
                
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            }
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
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
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
        this.announceZoom();
    }
    
    zoomOut() {
        this.scale = Math.max(0.5, this.scale * 0.8);
        this.updateTransform();
        this.announceZoom();
    }
    
    resetView() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
        this.announceAction('ビューをリセットしました');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.wrapper.requestFullscreen?.() || 
            this.wrapper.mozRequestFullScreen?.() || 
            this.wrapper.webkitRequestFullscreen?.() || 
            this.wrapper.msRequestFullscreen?.();
            this.announceAction('フルスクリーンモードに入りました');
        } else {
            document.exitFullscreen?.() || 
            document.mozCancelFullScreen?.() || 
            document.webkitExitFullscreen?.() || 
            document.msExitFullscreen?.();
            this.announceAction('フルスクリーンモードを終了しました');
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
            
            <h3>主要機能・特徴</h3>
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
        const closeBtn = this.modal.querySelector('.modal-close');
        closeBtn?.focus();
        
        // フォーカストラップ
        this.setupFocusTrap();
    }
    
    hideModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // フォーカスを元の要素に戻す
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
    }
    
    setupFocusTrap() {
        const focusableElements = this.modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        this.modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }
    
    // アクセシビリティ：スクリーンリーダー用のアナウンス
    announceZoom() {
        const percentage = Math.round(this.scale * 100);
        this.announceAction(`ズーム: ${percentage}%`);
    }
    
    announceAction(message) {
        // aria-live リージョンがあれば利用
        let announcer = document.getElementById('aria-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'aria-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.position = 'absolute';
            announcer.style.left = '-10000px';
            announcer.style.width = '1px';
            announcer.style.height = '1px';
            announcer.style.overflow = 'hidden';
            document.body.appendChild(announcer);
        }
        
        announcer.textContent = message;
        
        // 短時間後にクリア
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    }
    
    // パフォーマンス監視
    measurePerformance() {
        if (window.performance && window.performance.mark) {
            window.performance.mark('diagram-interaction-start');
        }
    }
    
    // エラーハンドリング
    handleError(error, context = '') {
        console.error(`Diagram Error${context ? ' (' + context + ')' : ''}:`, error);
        
        // ユーザーフレンドリーなエラー表示
        this.announceAction('操作中にエラーが発生しました。再試行してください。');
    }
}

// エラーハンドリング付きで初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.systemDiagramManager = new SystemDiagramManager();
    } catch (error) {
        console.error('System Diagram initialization failed:', error);
        
        // フォールバック表示
        const container = document.querySelector('.diagram-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <h2>システム構成図の読み込み中にエラーが発生しました</h2>
                    <p>ページを再読み込みしてください。</p>
                    <button onclick="location.reload()" style="padding: 0.5rem 1rem; margin-top: 1rem;">
                        再読み込み
                    </button>
                </div>
            `;
        }
    }
});

// パフォーマンス監視（開発時のみ）
if (window.performance && console.time) {
    window.addEventListener('load', () => {
        console.time('Diagram Load Time');
        requestAnimationFrame(() => {
            console.timeEnd('Diagram Load Time');
        });
    });
}