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
        const sortColumnSelect = document.getElementById("default-sort-column");
        const sortDirectionSelect = document.getElementById("default-sort-direction");
        
        if (sortColumnSelect) {
            // ソート列オプションを動的生成
            sortColumnSelect.innerHTML = "";
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
                const option = document.createElement("option");
                option.value = column.id;
                option.textContent = column.name;
                sortColumnSelect.appendChild(option);
            });
            
            sortColumnSelect.value = this.settings.defaultSort.column;
        }
        
        if (sortDirectionSelect) {
            sortDirectionSelect.value = this.settings.defaultSort.direction;
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
        
        // ソート設定の取得
        const sortColumnSelect = document.getElementById("default-sort-column");
        const sortDirectionSelect = document.getElementById("default-sort-direction");
        
        if (sortColumnSelect && sortDirectionSelect) {
            this.settings.defaultSort.column = sortColumnSelect.value;
            this.settings.defaultSort.direction = sortDirectionSelect.value;
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
        
        return result;
    }
}