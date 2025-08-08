class UserManualManager {
    constructor() {
        this.sidebar = document.getElementById('manual-sidebar');
        this.content = document.getElementById('manual-content');
        this.toc = document.getElementById('manual-toc');
        this.searchInput = document.getElementById('manual-search');
        this.progressBar = document.getElementById('reading-progress');
        this.progressPercentage = document.getElementById('progress-percentage');
        
        this.sections = [];
        this.currentSection = null;
        this.bookmarks = this.loadBookmarks();
        this.fontSize = 'normal';
        
        this.init();
    }
    
    init() {
        this.setupSections();
        this.setupNavigation();
        this.setupSearch();
        this.setupActions();
        this.setupScrollTracking();
        this.setupResponsive();
        this.setupAccessibility();
        this.updateProgress();
    }
    
    setupSections() {
        // セクション情報を取得
        this.sections = Array.from(document.querySelectorAll('.manual-section')).map(section => ({
            id: section.id,
            element: section,
            title: section.querySelector('h2').textContent,
            offset: section.offsetTop
        }));
    }
    
    setupNavigation() {
        // TOC リンクのクリックハンドリング
        this.toc.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
                this.setActiveNavItem(e.target);
                
                // モバイルでサイドバーを閉じる
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            }
        });
        
        // サイドバートグル
        const sidebarToggle = document.getElementById('sidebar-toggle');
        sidebarToggle?.addEventListener('click', () => {
            this.toggleSidebar();
        });
    }
    
    setupSearch() {
        const searchBtn = document.querySelector('.search-btn');
        
        // 検索機能
        this.searchInput?.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
        
        searchBtn?.addEventListener('click', () => {
            this.performSearch(this.searchInput.value);
        });
        
        // エンターキーでの検索
        this.searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch(e.target.value);
            }
        });
    }
    
    setupActions() {
        // 印刷ボタン
        const printBtn = document.getElementById('print-manual');
        printBtn?.addEventListener('click', () => {
            this.printManual();
        });
        
        // ブックマークボタン
        const bookmarkBtn = document.getElementById('bookmark-section');
        bookmarkBtn?.addEventListener('click', () => {
            this.toggleBookmark();
        });
        
        // フォントサイズボタン
        const fontSizeBtn = document.getElementById('font-size-toggle');
        fontSizeBtn?.addEventListener('click', () => {
            this.toggleFontSize();
        });
    }
    
    setupScrollTracking() {
        // スクロール位置の監視
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateActiveSection();
                    this.updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    setupResponsive() {
        // ウィンドウサイズ変更の監視
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 初期サイドバー状態設定
        this.handleResize();
    }
    
    setupAccessibility() {
        // キーボードナビゲーション
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // フォーカス管理
        this.setupFocusManagement();
    }
    
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        const headerOffset = 80; // ナビゲーションヘッダーの高さを考慮
        const elementPosition = section.offsetTop;
        const offsetPosition = elementPosition - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        
        // 履歴に追加（ブラウザの戻るボタン対応）
        if (history.pushState) {
            history.pushState(null, null, `#${sectionId}`);
        }
        
        // アクセシビリティ：スクリーンリーダーに通知
        this.announceNavigation(`${section.querySelector('h2').textContent}セクションに移動しました`);
    }
    
    setActiveNavItem(activeLink) {
        // 既存のアクティブ状態をクリア
        document.querySelectorAll('.manual-toc a').forEach(link => {
            link.classList.remove('active');
        });
        
        // 新しいアクティブ状態を設定
        activeLink.classList.add('active');
        this.currentSection = activeLink.getAttribute('href').substring(1);
    }
    
    updateActiveSection() {
        if (this.sections.length === 0) return;
        
        const scrollPosition = window.scrollY + 100;
        
        // 現在のスクロール位置に最も近いセクションを見つける
        let activeSection = this.sections[0];
        
        for (const section of this.sections) {
            if (scrollPosition >= section.element.offsetTop) {
                activeSection = section;
            } else {
                break;
            }
        }
        
        // TOCの対応するリンクをアクティブにする
        const activeLink = document.querySelector(`a[href="#${activeSection.id}"]`);
        if (activeLink && !activeLink.classList.contains('active')) {
            this.setActiveNavItem(activeLink);
        }
    }
    
    updateProgress() {
        if (!this.content || !this.progressBar || !this.progressPercentage) return;
        
        const contentHeight = this.content.scrollHeight;
        const windowHeight = window.innerHeight;
        const scrollPosition = window.scrollY;
        const maxScroll = contentHeight - windowHeight;
        
        if (maxScroll <= 0) {
            this.setProgress(100);
            return;
        }
        
        const progress = Math.min(100, Math.max(0, (scrollPosition / maxScroll) * 100));
        this.setProgress(progress);
    }
    
    setProgress(percentage) {
        this.progressBar.style.setProperty('--progress', `${percentage}%`);
        this.progressPercentage.textContent = `${Math.round(percentage)}%`;
    }
    
    performSearch(query) {
        if (!query.trim()) {
            this.clearSearchHighlights();
            return;
        }
        
        this.clearSearchHighlights();
        const results = this.searchContent(query.toLowerCase());
        
        if (results.length > 0) {
            // 最初の結果にスクロール
            this.scrollToSection(results[0].sectionId);
            this.highlightSearchResults(query);
            this.announceNavigation(`${results.length}件の検索結果が見つかりました`);
        } else {
            this.announceNavigation('検索結果が見つかりませんでした');
        }
    }
    
    searchContent(query) {
        const results = [];
        
        this.sections.forEach(section => {
            const content = section.element.textContent.toLowerCase();
            if (content.includes(query)) {
                results.push({
                    sectionId: section.id,
                    title: section.title,
                    element: section.element
                });
            }
        });
        
        return results;
    }
    
    highlightSearchResults(query) {
        // 簡単なハイライト実装
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        
        this.sections.forEach(section => {
            const textNodes = this.getTextNodes(section.element);
            
            textNodes.forEach(node => {
                if (node.textContent.toLowerCase().includes(query.toLowerCase())) {
                    const parent = node.parentNode;
                    const highlighted = node.textContent.replace(regex, '<mark>$1</mark>');
                    
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = highlighted;
                    parent.replaceChild(wrapper, node);
                }
            });
        });
    }
    
    clearSearchHighlights() {
        document.querySelectorAll('mark').forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    }
    
    getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        return textNodes;
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    }
    
    printManual() {
        // 印刷前の準備
        document.body.classList.add('printing');
        
        // 印刷実行
        window.print();
        
        // 印刷後のクリーンアップ
        setTimeout(() => {
            document.body.classList.remove('printing');
        }, 1000);
        
        this.announceNavigation('印刷ダイアログを開きました');
    }
    
    toggleBookmark() {
        if (!this.currentSection) {
            this.announceNavigation('ブックマークするセクションを選択してください');
            return;
        }
        
        const sectionId = this.currentSection;
        const sectionTitle = this.sections.find(s => s.id === sectionId)?.title;
        
        if (this.bookmarks.includes(sectionId)) {
            // ブックマーク削除
            this.bookmarks = this.bookmarks.filter(id => id !== sectionId);
            this.announceNavigation(`${sectionTitle}のブックマークを削除しました`);
        } else {
            // ブックマーク追加
            this.bookmarks.push(sectionId);
            this.announceNavigation(`${sectionTitle}をブックマークに追加しました`);
        }
        
        this.saveBookmarks();
        this.updateBookmarkButton();
    }
    
    toggleFontSize() {
        const sizes = ['normal', 'large'];
        const currentIndex = sizes.indexOf(this.fontSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        this.fontSize = sizes[nextIndex];
        
        // CSSクラスを更新
        document.body.classList.remove('font-size-normal', 'font-size-large');
        document.body.classList.add(`font-size-${this.fontSize}`);
        
        // 設定を保存
        localStorage.setItem('manual-font-size', this.fontSize);
        
        const sizeNames = { normal: '標準', large: '大' };
        this.announceNavigation(`文字サイズを${sizeNames[this.fontSize]}に変更しました`);
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('open');
        const isOpen = this.sidebar.classList.contains('open');
        
        // ARIA状態を更新
        const toggle = document.getElementById('sidebar-toggle');
        toggle?.setAttribute('aria-expanded', isOpen.toString());
        
        this.announceNavigation(isOpen ? 'サイドバーを開きました' : 'サイドバーを閉じました');
    }
    
    closeSidebar() {
        this.sidebar.classList.remove('open');
        const toggle = document.getElementById('sidebar-toggle');
        toggle?.setAttribute('aria-expanded', 'false');
    }
    
    handleResize() {
        if (window.innerWidth > 768) {
            this.sidebar.classList.remove('open');
            const toggle = document.getElementById('sidebar-toggle');
            toggle?.setAttribute('aria-expanded', 'false');
        }
        
        // セクションのオフセットを再計算
        this.sections.forEach(section => {
            section.offset = section.element.offsetTop;
        });
    }
    
    handleKeyboardNavigation(e) {
        // Escキーでサイドバーを閉じる
        if (e.key === 'Escape') {
            this.closeSidebar();
            return;
        }
        
        // Ctrl/Cmd + F で検索フォーカス
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            this.searchInput?.focus();
            return;
        }
        
        // Ctrl/Cmd + P で印刷
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            this.printManual();
            return;
        }
        
        // 矢印キーでセクション間移動
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                this.navigateSection(e.key === 'ArrowUp' ? -1 : 1);
            }
        }
    }
    
    navigateSection(direction) {
        if (!this.currentSection) return;
        
        const currentIndex = this.sections.findIndex(s => s.id === this.currentSection);
        if (currentIndex === -1) return;
        
        const nextIndex = currentIndex + direction;
        if (nextIndex >= 0 && nextIndex < this.sections.length) {
            const nextSection = this.sections[nextIndex];
            this.scrollToSection(nextSection.id);
        }
    }
    
    setupFocusManagement() {
        // リンクのフォーカス時にセクションを表示
        document.querySelectorAll('.manual-toc a').forEach(link => {
            link.addEventListener('focus', () => {
                // サイドバーがスクロール可能な場合、フォーカス要素を表示
                link.scrollIntoView({ block: 'nearest' });
            });
        });
    }
    
    loadBookmarks() {
        try {
            const saved = localStorage.getItem('manual-bookmarks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Failed to load bookmarks:', error);
            return [];
        }
    }
    
    saveBookmarks() {
        try {
            localStorage.setItem('manual-bookmarks', JSON.stringify(this.bookmarks));
        } catch (error) {
            console.warn('Failed to save bookmarks:', error);
        }
    }
    
    updateBookmarkButton() {
        const bookmarkBtn = document.getElementById('bookmark-section');
        if (!bookmarkBtn) return;
        
        const isBookmarked = this.currentSection && this.bookmarks.includes(this.currentSection);
        bookmarkBtn.textContent = isBookmarked ? '🔖 ブックマーク済み' : '🔖 ブックマーク';
        bookmarkBtn.setAttribute('aria-pressed', isBookmarked.toString());
    }
    
    // アクセシビリティ：スクリーンリーダー用のアナウンス
    announceNavigation(message) {
        let announcer = document.getElementById('manual-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'manual-announcer';
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
    
    // FAQ項目のクリック展開機能
    setupFAQExpansion() {
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                const answer = faqItem.querySelector('.faq-answer');
                const isExpanded = faqItem.classList.contains('expanded');
                
                // 他のFAQを閉じる
                document.querySelectorAll('.faq-item.expanded').forEach(item => {
                    if (item !== faqItem) {
                        item.classList.remove('expanded');
                        item.querySelector('.faq-answer').style.display = 'none';
                    }
                });
                
                // 現在のFAQの状態を切り替え
                faqItem.classList.toggle('expanded');
                answer.style.display = isExpanded ? 'none' : 'block';
                
                // ARIA状態を更新
                question.setAttribute('aria-expanded', (!isExpanded).toString());
                
                this.announceNavigation(isExpanded ? 'FAQ項目を閉じました' : 'FAQ項目を開きました');
            });
            
            // 初期状態を設定
            question.setAttribute('aria-expanded', 'false');
        });
    }
    
    // 初期設定の復元
    restoreSettings() {
        // フォントサイズの復元
        const savedFontSize = localStorage.getItem('manual-font-size');
        if (savedFontSize && ['normal', 'large'].includes(savedFontSize)) {
            this.fontSize = savedFontSize;
            document.body.classList.add(`font-size-${this.fontSize}`);
        }
        
        // URLハッシュがあれば該当セクションにスクロール
        if (window.location.hash) {
            const sectionId = window.location.hash.substring(1);
            setTimeout(() => {
                this.scrollToSection(sectionId);
            }, 100);
        }
    }
}

// エラーハンドリング付きで初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.userManualManager = new UserManualManager();
        
        // FAQ展開機能を追加で初期化
        window.userManualManager.setupFAQExpansion();
        
        // 設定復元
        window.userManualManager.restoreSettings();
        
        // パフォーマンス監視（開発環境用）
        if (window.performance && console.time) {
            console.log('User Manual loaded successfully');
        }
        
    } catch (error) {
        console.error('User Manual initialization failed:', error);
        
        // フォールバック表示
        const container = document.querySelector('.manual-container');
        if (container) {
            const errorMessage = document.createElement('div');
            errorMessage.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <h2>ユーザーマニュアルの読み込み中にエラーが発生しました</h2>
                    <p>ページを再読み込みしてください。</p>
                    <button onclick="location.reload()" style="padding: 0.5rem 1rem; margin-top: 1rem;">
                        再読み込み
                    </button>
                </div>
            `;
            container.appendChild(errorMessage);
        }
    }
});

// ページ離脱前の設定保存
window.addEventListener('beforeunload', () => {
    if (window.userManualManager) {
        window.userManualManager.saveBookmarks();
    }
});