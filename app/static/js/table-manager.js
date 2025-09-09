class TableManager {
    constructor(app) {
        this.app = app;
        this.settings = this.loadSettings();
        this.defaultSettings = {
            columns: {
                id: { visible: true, width: 60 },
                content: { visible: true, width: 300 },  // 受付内容は広く
                status: { visible: true, width: 250 },   // 対応状況も広く
                progress: { visible: true, width: 100 },
                system_type: { visible: true, width: 120 },
                product: { visible: true, width: 100 },
                reception_datetime: { visible: true, width: 140 },
                update_datetime: { visible: true, width: 140 }
            },
            pageSize: 100,
            autoScroll: true,
            defaultSort: {
                column: 'reception_datetime',
                direction: 'desc'
            },
            // 検索・フィルター用ソート設定
            searchSort: {
                priority1: { column: 'reception_datetime', direction: 'desc' },
                priority2: { column: null, direction: 'asc' },
                priority3: { column: null, direction: 'asc' }
            },
            // 重複検出用ソート設定（タイプ別）
            duplicateSort: {
                exact: {
                    priority1: { column: 'reception_datetime', direction: 'desc' },
                    priority2: { column: null, direction: 'asc' },
                    priority3: { column: null, direction: 'asc' }
                },
                content: {
                    priority1: { column: 'reception_datetime', direction: 'desc' },
                    priority2: { column: null, direction: 'asc' },
                    priority3: { column: null, direction: 'asc' }
                },
                status: {
                    priority1: { column: 'reception_datetime', direction: 'desc' },
                    priority2: { column: null, direction: 'asc' },
                    priority3: { column: null, direction: 'asc' }
                }
            }
        };
        
        this.setupEventListeners();
        this.applySettings();
        console.log("TableManager initialized with settings", this.settings);
    }
    
    setupEventListeners() {
        // テーブル設定ボタン
        const settingsBtn = document.getElementById("table-settings-btn");
        if (settingsBtn) {
            settingsBtn.addEventListener("click", () => this.openSettingsModal());
        }
        
        // リセット設定ボタン（ヘッダー）
        const resetBtn = document.getElementById("reset-settings-btn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => this.resetToDefault());
        }
        
        // モーダル内のボタン
        const applyBtn = document.getElementById("apply-settings-btn");
        if (applyBtn) {
            applyBtn.addEventListener("click", () => this.applySettingsFromModal());
        }
        
        const cancelBtn = document.getElementById("cancel-settings-btn");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => this.closeSettingsModal());
        }
        
        const resetModalBtn = document.getElementById("reset-to-default-btn");
        if (resetModalBtn) {
            resetModalBtn.addEventListener("click", () => this.resetModalToDefault());
        }
        
        // モーダルクローズボタン
        const modalClose = document.querySelector("#table-settings-modal .modal-close");
        if (modalClose) {
            modalClose.addEventListener("click", () => this.closeSettingsModal());
        }
        
        // モーダル背景クリックで閉じる
        const modal = document.getElementById("table-settings-modal");
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    this.closeSettingsModal();
                }
            });
        }
        
        // ソートタブ切り替え
        const tabButtons = document.querySelectorAll(".sort-tabs .tab-button");
        tabButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                this.switchSortTab(e.target.dataset.tab);
            });
        });
        
        // 重複検出タイプ変更時
        const dupSortTypeSelect = document.getElementById("duplicate-sort-type");
        if (dupSortTypeSelect) {
            dupSortTypeSelect.addEventListener("change", () => {
                this.loadDuplicateSortSettings(dupSortTypeSelect.value);
            });
        }
    }
    
    switchSortTab(tab) {
        // タブボタンのアクティブ状態を切り替え
        document.querySelectorAll(".sort-tabs .tab-button").forEach(button => {
            button.classList.toggle("active", button.dataset.tab === tab);
        });
        
        // パネルの表示を切り替え
        const searchPanel = document.getElementById("search-sort-panel");
        const duplicatePanel = document.getElementById("duplicate-sort-panel");
        
        if (tab === "search") {
            searchPanel.style.display = "block";
            duplicatePanel.style.display = "none";
        } else {
            searchPanel.style.display = "none";
            duplicatePanel.style.display = "block";
            // 重複検出タイプの設定を読み込み
            const dupType = document.getElementById("duplicate-sort-type").value;
            this.loadDuplicateSortSettings(dupType);
        }
    }
    
    openSettingsModal() {
        console.log("Opening table settings modal");
        this.populateModal();
        const modal = document.getElementById("table-settings-modal");
        if (modal) {
            modal.classList.remove("hidden");
        }
    }
    
    closeSettingsModal() {
        console.log("Closing table settings modal");
        const modal = document.getElementById("table-settings-modal");
        if (modal) {
            modal.classList.add("hidden");
        }
    }
    
    populateModal() {
        this.populateColumnSettings();
        this.populatePageSettings();
        this.populateSortSettings();
    }
    
    populateColumnSettings() {
        const container = document.getElementById("column-settings");
        if (!container) return;
        
        container.innerHTML = "";
        
        const columns = [
            { id: "id", name: "ID" },
            { id: "content", name: "受付内容" },
            { id: "status", name: "対応状況" },
            { id: "progress", name: "進捗" },
            { id: "system_type", name: "システム種別" },
            { id: "product", name: "製品" },
            { id: "reception_datetime", name: "受付日時" },
            { id: "update_datetime", name: "更新日時" }
        ];
        
        columns.forEach(column => {
            const setting = this.settings.columns[column.id];
            const item = document.createElement("div");
            item.className = "column-setting-item";
            
            item.innerHTML = `
                <input type="checkbox" id="col-${column.id}" ${setting.visible ? 'checked' : ''}>
                <label for="col-${column.id}">${column.name}</label>
                <div class="column-controls">
                    <label>幅:</label>
                    <input type="number" class="column-width-input" 
                           id="width-${column.id}" 
                           value="${setting.width}" 
                           min="50" max="500" step="10">
                    <span>px</span>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    populatePageSettings() {
        const pageSizeSelect = document.getElementById("modal-page-size");
        if (pageSizeSelect) {
            pageSizeSelect.value = this.settings.pageSize.toString();
        }
        
        const autoScrollCheckbox = document.getElementById("auto-scroll-enabled");
        if (autoScrollCheckbox) {
            autoScrollCheckbox.checked = this.settings.autoScroll;
        }
    }
    
    populateSortSettings() {
        // 列オプションの共通リスト
        const columns = [
            { id: "", name: "なし" },
            { id: "id", name: "ID" },
            { id: "content", name: "受付内容" },
            { id: "status", name: "対応状況" },
            { id: "progress", name: "進捗" },
            { id: "system_type", name: "システム種別" },
            { id: "product", name: "製品" },
            { id: "reception_datetime", name: "受付日時" },
            { id: "update_datetime", name: "更新日時" }
        ];
        
        // すべてのソート列選択要素を取得してオプションを設定
        document.querySelectorAll(".sort-column-select").forEach(select => {
            select.innerHTML = "";
            columns.forEach(column => {
                const option = document.createElement("option");
                option.value = column.id;
                option.textContent = column.name;
                select.appendChild(option);
            });
        });
        
        // 検索・フィルター用ソート設定を読み込み
        this.loadSearchSortSettings();
        
        // 重複検出用ソート設定を読み込み（デフォルトは完全一致）
        this.loadDuplicateSortSettings("exact");
    }
    
    loadSearchSortSettings() {
        const searchSort = this.settings.searchSort || this.defaultSettings.searchSort;
        
        for (let i = 1; i <= 3; i++) {
            const priority = searchSort[`priority${i}`];
            const colSelect = document.getElementById(`search-sort-col-${i}`);
            const dirSelect = document.getElementById(`search-sort-dir-${i}`);
            
            if (colSelect && priority) {
                colSelect.value = priority.column || "";
            }
            if (dirSelect && priority) {
                dirSelect.value = priority.direction || "asc";
            }
        }
    }
    
    loadDuplicateSortSettings(duplicateType) {
        const duplicateSort = this.settings.duplicateSort || this.defaultSettings.duplicateSort;
        const typeSort = duplicateSort[duplicateType] || duplicateSort.exact;
        
        for (let i = 1; i <= 3; i++) {
            const priority = typeSort[`priority${i}`];
            const colSelect = document.getElementById(`dup-sort-col-${i}`);
            const dirSelect = document.getElementById(`dup-sort-dir-${i}`);
            
            if (colSelect && priority) {
                colSelect.value = priority.column || "";
            }
            if (dirSelect && priority) {
                dirSelect.value = priority.direction || "asc";
            }
        }
    }
    
    applySettingsFromModal() {
        console.log("Applying settings from modal");
        
        // 列設定の取得
        const columns = ["id", "content", "status", "progress", "system_type", "product", "reception_datetime", "update_datetime"];
        
        columns.forEach(columnId => {
            const visibleCheckbox = document.getElementById(`col-${columnId}`);
            const widthInput = document.getElementById(`width-${columnId}`);
            
            if (visibleCheckbox && widthInput) {
                this.settings.columns[columnId].visible = visibleCheckbox.checked;
                this.settings.columns[columnId].width = parseInt(widthInput.value) || this.defaultSettings.columns[columnId].width;
            }
        });
        
        // ページ設定の取得
        const pageSizeSelect = document.getElementById("modal-page-size");
        if (pageSizeSelect) {
            this.settings.pageSize = parseInt(pageSizeSelect.value) || 100;
        }
        
        const autoScrollCheckbox = document.getElementById("auto-scroll-enabled");
        if (autoScrollCheckbox) {
            this.settings.autoScroll = autoScrollCheckbox.checked;
        }
        
        // 検索・フィルター用ソート設定の保存
        for (let i = 1; i <= 3; i++) {
            const colSelect = document.getElementById(`search-sort-col-${i}`);
            const dirSelect = document.getElementById(`search-sort-dir-${i}`);
            
            if (colSelect && dirSelect) {
                if (!this.settings.searchSort) {
                    this.settings.searchSort = JSON.parse(JSON.stringify(this.defaultSettings.searchSort));
                }
                this.settings.searchSort[`priority${i}`] = {
                    column: colSelect.value || null,
                    direction: dirSelect.value || "asc"
                };
            }
        }
        
        // 重複検出用ソート設定の保存
        const dupType = document.getElementById("duplicate-sort-type").value;
        for (let i = 1; i <= 3; i++) {
            const colSelect = document.getElementById(`dup-sort-col-${i}`);
            const dirSelect = document.getElementById(`dup-sort-dir-${i}`);
            
            if (colSelect && dirSelect) {
                if (!this.settings.duplicateSort) {
                    this.settings.duplicateSort = JSON.parse(JSON.stringify(this.defaultSettings.duplicateSort));
                }
                if (!this.settings.duplicateSort[dupType]) {
                    this.settings.duplicateSort[dupType] = JSON.parse(JSON.stringify(this.defaultSettings.duplicateSort[dupType]));
                }
                this.settings.duplicateSort[dupType][`priority${i}`] = {
                    column: colSelect.value || null,
                    direction: dirSelect.value || "asc"
                };
            }
        }
        
        this.saveSettings();
        this.applySettings();
        this.closeSettingsModal();
        
        // テーブルを再描画
        if (this.app.currentData && this.app.currentData.length > 0) {
            this.app.renderTable();
        }
        
        console.log("Settings applied:", this.settings);
    }
    
    resetModalToDefault() {
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        this.populateModal();
    }
    
    resetToDefault() {
        if (confirm("テーブル設定をデフォルトに戻しますか？")) {
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
            this.saveSettings();
            this.applySettings();
            
            // テーブルを再描画
            if (this.app.currentData && this.app.currentData.length > 0) {
                this.app.renderTable();
            }
            
            console.log("Settings reset to default");
        }
    }
    
    applySettings() {
        this.applyColumnSettings();
        this.applyPageSettings();
    }
    
    applyColumnSettings() {
        // CSSでカラム幅を設定
        const styleId = "table-column-styles";
        let existingStyle = document.getElementById(styleId);
        
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const style = document.createElement("style");
        style.id = styleId;
        
        let css = "";
        Object.entries(this.settings.columns).forEach(([columnId, setting]) => {
            const columnIndex = this.getColumnIndex(columnId);
            if (columnIndex >= 0) {
                css += `
                    .data-table th:nth-child(${columnIndex + 1}),
                    .data-table td:nth-child(${columnIndex + 1}) {
                        ${setting.visible ? '' : 'display: none;'}
                        ${setting.visible ? `width: ${setting.width}px; min-width: ${setting.width}px; max-width: ${setting.width}px;` : ''}
                    }
                `;
            }
        });
        
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    applyPageSettings() {
        // ページサイズの適用
        const pageSizeSelect = document.getElementById("page-size");
        if (pageSizeSelect && pageSizeSelect.value !== this.settings.pageSize.toString()) {
            pageSizeSelect.value = this.settings.pageSize.toString();
        }
    }
    
    getColumnIndex(columnId) {
        const columns = ["checkbox", "id", "content", "status", "progress", "system_type", "product", "reception_datetime", "update_datetime"];
        return columns.indexOf(columnId);
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem("tableSettings");
            if (saved) {
                const parsed = JSON.parse(saved);
                // 設定をデフォルトとマージ
                return this.mergeSettings(this.getDefaultSettings(), parsed);
            }
        } catch (error) {
            console.warn("Failed to load table settings:", error);
        }
        return this.getDefaultSettings();
    }
    
    saveSettings() {
        try {
            localStorage.setItem("tableSettings", JSON.stringify(this.settings));
            console.log("Table settings saved");
        } catch (error) {
            console.error("Failed to save table settings:", error);
        }
    }
    
    getDefaultSettings() {
        return {
            columns: {
                id: { visible: true, width: 60 },
                content: { visible: true, width: 300 },  // 受付内容は広く
                status: { visible: true, width: 250 },   // 対応状況も広く
                progress: { visible: true, width: 100 },
                system_type: { visible: true, width: 120 },
                product: { visible: true, width: 100 },
                reception_datetime: { visible: true, width: 140 },
                update_datetime: { visible: true, width: 140 }
            },
            pageSize: 100,
            autoScroll: true,
            defaultSort: {
                column: 'reception_datetime',
                direction: 'desc'
            },
            // 検索・フィルター用ソート設定
            searchSort: {
                priority1: { column: 'reception_datetime', direction: 'desc' },
                priority2: { column: null, direction: 'asc' },
                priority3: { column: null, direction: 'asc' }
            },
            // 重複検出用ソート設定（タイプ別）
            duplicateSort: {
                exact: {
                    priority1: { column: 'reception_datetime', direction: 'desc' },
                    priority2: { column: null, direction: 'asc' },
                    priority3: { column: null, direction: 'asc' }
                },
                content: {
                    priority1: { column: 'reception_datetime', direction: 'desc' },
                    priority2: { column: null, direction: 'asc' },
                    priority3: { column: null, direction: 'asc' }
                },
                status: {
                    priority1: { column: 'reception_datetime', direction: 'desc' },
                    priority2: { column: null, direction: 'asc' },
                    priority3: { column: null, direction: 'asc' }
                }
            }
        };
    }
    
    mergeSettings(defaults, saved) {
        const result = JSON.parse(JSON.stringify(defaults));
        
        if (saved.columns) {
            Object.keys(result.columns).forEach(key => {
                if (saved.columns[key]) {
                    result.columns[key] = { ...result.columns[key], ...saved.columns[key] };
                }
            });
        }
        
        if (saved.pageSize) result.pageSize = saved.pageSize;
        if (saved.autoScroll !== undefined) result.autoScroll = saved.autoScroll;
        if (saved.defaultSort) result.defaultSort = { ...result.defaultSort, ...saved.defaultSort };
        
        // 新しいソート設定のマージ
        if (saved.searchSort) {
            result.searchSort = this.mergeSortSettings(result.searchSort, saved.searchSort);
        }
        if (saved.duplicateSort) {
            Object.keys(result.duplicateSort).forEach(type => {
                if (saved.duplicateSort && saved.duplicateSort[type]) {
                    result.duplicateSort[type] = this.mergeSortSettings(result.duplicateSort[type], saved.duplicateSort[type]);
                }
            });
        }
        
        return result;
    }
    
    mergeSortSettings(defaultSort, savedSort) {
        const merged = { ...defaultSort };
        for (let i = 1; i <= 3; i++) {
            const key = `priority${i}`;
            if (savedSort[key]) {
                merged[key] = { ...defaultSort[key], ...savedSort[key] };
            }
        }
        return merged;
    }
    
    // 検索用ソート設定を取得
    getSearchSortParams() {
        const sort = this.settings.searchSort || this.defaultSettings.searchSort;
        const columns = [];
        const directions = [];
        
        for (let i = 1; i <= 3; i++) {
            const priority = sort[`priority${i}`];
            if (priority && priority.column) {
                columns.push(priority.column);
                directions.push(priority.direction);
            }
        }
        
        // 少なくとも1つのソート列が必要
        if (columns.length === 0) {
            columns.push('reception_datetime');
            directions.push('desc');
        }
        
        return {
            sort_by: columns.join(','),
            sort_order: directions.join(',')
        };
    }
    
    // 重複検出用ソート設定を取得
    getDuplicateSortParams(duplicateType) {
        const duplicateSort = this.settings.duplicateSort || this.defaultSettings.duplicateSort;
        const sort = duplicateSort[duplicateType] || duplicateSort.exact;
        const columns = [];
        const directions = [];
        
        for (let i = 1; i <= 3; i++) {
            const priority = sort[`priority${i}`];
            if (priority && priority.column) {
                columns.push(priority.column);
                directions.push(priority.direction);
            }
        }
        
        // 少なくとも1つのソート列が必要
        if (columns.length === 0) {
            columns.push('reception_datetime');
            directions.push('desc');
        }
        
        return {
            sort_by: columns.join(','),
            sort_order: directions.join(',')
        };
    }
}