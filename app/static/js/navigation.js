class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileToggle();
        this.setupActiveStates();
        this.setupBreadcrumbs();
        this.setupAccessibility();
    }

    setupMobileToggle() {
        const toggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (toggle && navLinks) {
            toggle.addEventListener('click', () => {
                const isOpen = navLinks.classList.toggle('active');
                
                // ARIA状態を更新
                toggle.setAttribute('aria-expanded', isOpen.toString());
                toggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
                
                // アクセシビリティ：フォーカス管理
                if (isOpen) {
                    const firstLink = navLinks.querySelector('a');
                    firstLink?.focus();
                }
            });

            // 画面サイズ変更時のクリーンアップ
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    navLinks.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.setAttribute('aria-label', 'メニューを開く');
                }
            });

            // Escキーでメニューを閉じる
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.setAttribute('aria-label', 'メニューを開く');
                    toggle.focus();
                }
            });

            // メニュー外をクリックした時に閉じる
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
                    if (navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        toggle.setAttribute('aria-expanded', 'false');
                        toggle.setAttribute('aria-label', 'メニューを開く');
                    }
                }
            });
        }
    }

    setupActiveStates() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');

        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            if (linkPath === currentPath) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
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

        // パンくずリストの構造化データも含める
        const breadcrumbsHTML = `
            <nav aria-label="パンくずリスト" class="breadcrumbs-nav">
                <ol class="breadcrumbs-list">
                    <li class="breadcrumb-item">
                        <a href="/" ${currentPath === '/' ? 'aria-current="page"' : ''}>
                            <span class="breadcrumb-icon">🏠</span>
                            <span class="breadcrumb-text">ホーム</span>
                        </a>
                    </li>
                    ${currentPath !== '/' ? `
                        <li class="breadcrumb-separator" aria-hidden="true">
                            <span>›</span>
                        </li>
                        <li class="breadcrumb-item">
                            <span class="breadcrumb-text current" aria-current="page">${currentTitle}</span>
                        </li>
                    ` : ''}
                </ol>
            </nav>
        `;

        breadcrumbsContainer.innerHTML = breadcrumbsHTML;
    }

    setupAccessibility() {
        // Skip link の追加
        this.addSkipLink();
        
        // フォーカス表示の強化
        this.enhanceFocusVisibility();
        
        // キーボードナビゲーション
        this.setupKeyboardNavigation();
    }

    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.textContent = 'メインコンテンツにスキップ';
        skipLink.className = 'skip-link';
        
        // スタイルを追加
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10000;
            transition: top 0.3s;
        `;
        
        // フォーカス時に表示
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // メインコンテンツにIDを設定
        const main = document.querySelector('main');
        if (main && !main.id) {
            main.id = 'main';
        }
    }

    enhanceFocusVisibility() {
        // カスタムフォーカススタイルを適用
        const style = document.createElement('style');
        style.textContent = `
            .nav-links a:focus,
            .nav-toggle:focus,
            .breadcrumb-item a:focus,
            .skip-link:focus {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
                border-radius: 4px;
            }
            
            @media (prefers-reduced-motion: reduce) {
                * {
                    transition: none !important;
                    animation: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupKeyboardNavigation() {
        // ナビゲーション内でのTab循環
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        const focusableElements = navLinks.querySelectorAll('a');
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Tab循環の実装
        navLinks.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                // Shift+Tab（逆方向）
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab（順方向）
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });

        // 矢印キーでのナビゲーション
        navLinks.addEventListener('keydown', (e) => {
            const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
            
            if (currentIndex === -1) return;
            
            let nextIndex;
            
            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % focusableElements.length;
                    focusableElements[nextIndex].focus();
                    break;
                    
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
                    focusableElements[nextIndex].focus();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    firstElement.focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    lastElement.focus();
                    break;
            }
        });
    }

    // 動的にページタイトルを更新（SPA用）
    updatePageTitle(title) {
        document.title = `${title} - 重複データ管理システム`;
        
        // OpenGraph メタデータも更新
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.content = document.title;
        }
    }

    // アクセシビリティ：ページ変更の通知
    announcePageChange(message) {
        let announcer = document.getElementById('page-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'page-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.cssText = `
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `;
            document.body.appendChild(announcer);
        }
        
        announcer.textContent = message;
        
        // 短時間後にクリア
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    }

    // 外部ナビゲーション（他のJSクラスから呼び出し可能）
    navigateTo(path, title) {
        // 実際のナビゲーション実行
        window.location.href = path;
        
        // タイトル更新
        if (title) {
            this.updatePageTitle(title);
        }
        
        // アクセシビリティ通知
        this.announcePageChange(`${title || 'ページ'}に移動しました`);
    }

    // エラー状態の表示
    showNavigationError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'navigation-error';
        errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem;
            border-radius: 4px;
            z-index: 9999;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `;
        errorContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>⚠️</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; margin-left: auto;">×</button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
        
        // 5秒後に自動削除
        setTimeout(() => {
            if (errorContainer.parentElement) {
                errorContainer.remove();
            }
        }, 5000);
    }

    // ローディング状態の表示/非表示
    showLoading() {
        let loader = document.getElementById('navigation-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'navigation-loader';
            loader.setAttribute('role', 'status');
            loader.setAttribute('aria-label', '読み込み中');
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: linear-gradient(90deg, var(--primary-color) 0%, transparent 100%);
                z-index: 9999;
                animation: loading 2s infinite;
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100vw); }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'block';
    }

    hideLoading() {
        const loader = document.getElementById('navigation-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.navigationManager = new NavigationManager();
    } catch (error) {
        console.error('Navigation initialization failed:', error);
    }
});

// パフォーマンス監視
if (window.performance) {
    window.addEventListener('load', () => {
        const navigation = window.performance.getEntriesByType('navigation')[0];
        if (navigation) {
            console.log('Navigation Performance:', {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                loadComplete: navigation.loadEventEnd - navigation.navigationStart
            });
        }
    });
}