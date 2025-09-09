class DuplicateManagementApp {
    constructor() {
        this.currentData = [];
        this.currentFilters = {};
        this.selectedIds = new Set();
        this.totalCount = 0;
        this.currentOffset = 0;
        this.hasMore = false;
        this.isLoading = false;
        this.metadata = null;
        this.isDuplicateMode = false;  // 重複モード状態を追加
        this.includeDeleted = false;   // 削除済み表示フラグ
        this.statistics = null;        // 統計情報
        
        // モード管理
        this.displayMode = 'normal';   // 'normal' or 'duplicate'
        this.currentDuplicateType = null;
        this.duplicateData = null;
        
        // 重複モード用のページング状態
        this.duplicateAllData = [];    // 全重複データを保持
        this.duplicateOffset = 0;      // 重複モードのオフセット
        this.duplicateHasMore = false; // 重複モードの追加データ有無
        
        // ページング情報
        this.pagination = {
            currentPage: 1,
            totalPages: 1,
            pageSize: 100,
            totalCount: 0,
            startIndex: 0,
            endIndex: 0
        };

        this.init();
    }

    async init() {
        try {
            console.log("アプリケーション初期化開始...");
            
            // 初期化
            await this.loadMetadata();
            await this.loadData();
            this.setupEventListeners();
            
            // 他のマネージャーを初期化
            this.tableManager = new TableManager(this);
            this.filterManager = new FilterManager(this);
            this.deleteManager = new DeleteManager(this);

            console.log("アプリケーション初期化完了");
        } catch (error) {
            console.error("アプリケーション初期化エラー:", error);
            this.showError("アプリケーションの初期化に失敗しました。");
        }
    }

    async loadMetadata() {
        try {
            const response = await fetch("/api/metadata");
            if (!response.ok) {
                throw new Error("メタデータの取得に失敗しました。");
            }

            this.metadata = await response.json();
            this.setupFilterOptions();
        } catch (error) {
            console.error("メタデータ読み込みエラー:", error);
            throw error;
        }
    }

    setupFilterOptions() {
        // 進捗オプション設定
        const progressSelect = document.getElementById("progress");
        this.metadata.progress_options.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.textContent = option;
            progressSelect.appendChild(optionElement);
        });

        // システム種別オプション設定
        const systemTypeSelect = document.getElementById("system-type");
        this.metadata.system_type_options.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.textContent = option;
            systemTypeSelect.appendChild(optionElement);
        });

        // 製品オプション設定
        const productSelect = document.getElementById("product");
        this.metadata.product_options.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.textContent = option;
            productSelect.appendChild(optionElement);
        });
    }

    async loadData(offset = 0, append = false) {
        try {
            this.showLoading(true);

            // TableManagerからソート設定を取得
            const sortParams = this.tableManager ? this.tableManager.getSearchSortParams() : {
                sort_by: "reception_datetime",
                sort_order: "desc"
            };

            const params = new URLSearchParams({
                offset: offset.toString(),
                limit: this.getPageSize().toString(),
                sort_by: sortParams.sort_by,
                sort_order: sortParams.sort_order,
                include_deleted: this.includeDeleted.toString(),
                ...this.currentFilters,
            });

            const response = await fetch(`/api/reception-data?${params}`);
            if (!response.ok) {
                throw new Error("データの取得に失敗しました。");
            }

            const data = await response.json();

            if (append) {
                this.currentData = [...this.currentData, ...data.data];
            } else {
                this.currentData = data.data;
                this.selectedIds.clear();
                this.isDuplicateMode = false;  // 通常データ読み込み時は重複モードを無効化
            }

            this.totalCount = data.total;
            this.currentOffset = data.offset;
            this.hasMore = data.has_more;
            this.statistics = data.statistics;

            this.renderTable();
            this.updateCounts();
            this.updateStatisticsDisplay();
        } catch (error) {
            console.error("データ読み込みエラー:", error);
            this.showError("データの読み込みに失敗しました。");
        } finally {
            this.showLoading(false);
        }
    }

    getPageSize() {
        const pageSizeSelect = document.getElementById("page-size");
        return parseInt(pageSizeSelect.value) || 100;
    }

    renderTable() {
        const tableHeader = document.getElementById("table-header");
        const tableBody = document.getElementById("table-body");

        // ヘッダーをクリア（チェックボックス列以外）
        while (tableHeader.children.length > 1) {
            tableHeader.removeChild(tableHeader.lastChild);
        }

        // 列ヘッダー作成
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
            const th = document.createElement("th");
            th.textContent = column.name;
            // ソート機能は無効化（テーブル設定から操作）
            th.dataset.column = column.id;
            tableHeader.appendChild(th);
        });

        // データ行を作成
        tableBody.innerHTML = "";
        this.currentData.forEach(record => {
            const row = document.createElement("tr");
            
            // 削除済みデータの視覚的区別
            if (record.reception_moddt) {
                row.classList.add("deleted-row");
            }
            
            // チェックボックス
            const checkboxCell = document.createElement("td");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = record.id;
            checkbox.checked = this.selectedIds.has(record.id);
            checkbox.addEventListener("change", (e) => {
                if (e.target.checked) {
                    this.selectedIds.add(record.id);
                } else {
                    this.selectedIds.delete(record.id);
                }
                this.updateCounts();
                this.updateActionButtons();
            });
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            // データ列
            columns.forEach(column => {
                const cell = document.createElement("td");
                let value = record[column.id];
                
                if (value === null || value === undefined) {
                    value = "";
                } else if (column.id.includes("datetime")) {
                    value = new Date(value).toLocaleString("ja-JP");
                }
                
                cell.textContent = value;
                cell.title = value; // ツールチップ
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    }

    updateCounts() {
        // 現在表示中件数（モードに応じて更新）
        const currentCountElement = document.getElementById("current-count");
        const duplicateDisplayedElement = document.getElementById("duplicate-displayed");
        
        if (this.displayMode === 'normal') {
            if (currentCountElement) {
                currentCountElement.textContent = this.currentData.length;
            }
        } else if (this.displayMode === 'duplicate') {
            if (duplicateDisplayedElement) {
                duplicateDisplayedElement.textContent = this.currentData.length;
            }
        }
        
        // 選択中件数（両モード共通）
        const selectedCountElement = document.getElementById("selected-count");
        const duplicateSelectedElement = document.getElementById("duplicate-selected");
        
        if (this.displayMode === 'normal') {
            if (selectedCountElement) {
                selectedCountElement.textContent = this.selectedIds.size;
            }
        } else if (this.displayMode === 'duplicate') {
            if (duplicateSelectedElement) {
                duplicateSelectedElement.textContent = this.selectedIds.size;
            }
        }
        
        // 削除件数・復元件数（両モード共通）
        const deleteCountElement = document.getElementById("delete-count");
        if (deleteCountElement) {
            deleteCountElement.textContent = this.selectedIds.size;
        }

        const restoreCountElement = document.getElementById("restore-count");
        if (restoreCountElement) {
            restoreCountElement.textContent = this.selectedIds.size;
        }

        // データ範囲表示
        const startIndex = this.currentOffset + 1;
        const endIndex = this.currentOffset + this.currentData.length;
        const dataRangeElement = document.getElementById("data-range");
        if (dataRangeElement) {
            dataRangeElement.textContent = `${startIndex}-${endIndex}件目`;
        }
        
        // ページネーション情報を更新
        this.updatePaginationInfo();
    }
    
    updatePaginationInfo() {
        const pageSize = this.getPageSize();
        this.pagination.pageSize = pageSize;
        
        // 総ページ数の計算
        this.pagination.totalPages = Math.ceil(this.totalCount / pageSize) || 1;
        
        // 現在のページ番号の計算
        if (this.displayMode === 'normal') {
            this.pagination.currentPage = Math.floor(this.currentOffset / pageSize) + 1;
        } else {
            this.pagination.currentPage = Math.floor(this.duplicateOffset / pageSize) + 1;
        }
        
        // 表示範囲の計算
        if (this.totalCount === 0) {
            this.pagination.startIndex = 0;
            this.pagination.endIndex = 0;
        } else {
            this.pagination.startIndex = (this.pagination.currentPage - 1) * pageSize + 1;
            this.pagination.endIndex = Math.min(
                this.pagination.startIndex + this.currentData.length - 1,
                this.totalCount
            );
        }
        
        // UI更新
        this.updatePaginationUI();
    }
    
    updatePaginationUI() {
        const paginationText = document.getElementById("pagination-text");
        const currentPageSpan = document.getElementById("current-page");
        const totalPagesSpan = document.getElementById("total-pages");
        
        if (this.totalCount === 0) {
            paginationText.textContent = "データがありません";
        } else {
            paginationText.textContent = 
                `全${this.totalCount.toLocaleString()}件中 ${this.pagination.startIndex.toLocaleString()}-${this.pagination.endIndex.toLocaleString()}件を表示`;
        }
        
        currentPageSpan.textContent = this.pagination.currentPage;
        totalPagesSpan.textContent = this.pagination.totalPages;
        
        // ボタンの有効/無効制御
        this.updatePaginationButtons();
    }
    
    updatePaginationButtons() {
        const firstBtn = document.getElementById("first-page-btn");
        const prevBtn = document.getElementById("prev-page-btn");
        const nextBtn = document.getElementById("next-page-btn");
        const lastBtn = document.getElementById("last-page-btn");
        
        firstBtn.disabled = this.pagination.currentPage === 1;
        prevBtn.disabled = this.pagination.currentPage === 1;
        nextBtn.disabled = this.pagination.currentPage === this.pagination.totalPages;
        lastBtn.disabled = this.pagination.currentPage === this.pagination.totalPages;
    }

    updateStatisticsDisplay() {
        if (this.displayMode === 'normal' && this.statistics) {
            document.getElementById("total-all").textContent = 
                this.statistics.total_records.toLocaleString();
            document.getElementById("total-active").textContent = 
                this.statistics.active_records.toLocaleString();
            document.getElementById("total-deleted").textContent = 
                this.statistics.deleted_records.toLocaleString();
        }
    }

    // モード切り替えメソッド
    switchToNormalMode() {
        this.displayMode = 'normal';
        this.isDuplicateMode = false;
        this.currentDuplicateType = null;
        this.duplicateData = null;
        
        this.updateModeDisplay();
        this.updateStatisticsDisplay();
    }

    switchToDuplicateMode(duplicateType, duplicateData) {
        this.displayMode = 'duplicate';
        this.isDuplicateMode = true;
        this.currentDuplicateType = duplicateType;
        this.duplicateData = duplicateData;
        
        this.updateModeDisplay();
        this.updateDuplicateStatistics();
    }

    updateModeDisplay() {
        const modeIndicator = document.getElementById("mode-indicator");
        const modeLabel = document.getElementById("mode-label");
        const backButton = document.getElementById("back-to-normal");
        const statisticsPanel = document.querySelector(".statistics-panel");
        const normalStats = document.getElementById("normal-stats");
        const duplicateStats = document.getElementById("duplicate-stats");

        if (this.displayMode === 'normal') {
            // 通常モード
            modeIndicator.className = "mode-indicator normal-mode";
            modeLabel.textContent = "📊 通常データ表示";
            backButton.classList.add("hidden");
            statisticsPanel.classList.remove("duplicate-mode");
            normalStats.classList.remove("hidden");
            duplicateStats.classList.add("hidden");
        } else {
            // 重複モード
            const typeLabels = {
                'exact': '完全一致',
                'content': '受付内容',
                'status': '対応状況'
            };
            modeIndicator.className = "mode-indicator duplicate-mode";
            modeLabel.textContent = `🔍 重複データ表示 - ${typeLabels[this.currentDuplicateType] || this.currentDuplicateType}`;
            backButton.classList.remove("hidden");
            statisticsPanel.classList.add("duplicate-mode");
            normalStats.classList.add("hidden");
            duplicateStats.classList.remove("hidden");
        }
    }

    updateDuplicateStatistics() {
        if (this.duplicateData) {
            document.getElementById("duplicate-groups").textContent = this.duplicateData.total_groups;
            document.getElementById("duplicate-total").textContent = this.duplicateData.total_duplicates;
            document.getElementById("duplicate-displayed").textContent = this.currentData.length;
        }
    }

    returnToNormalMode() {
        console.log("通常表示モードに戻ります");
        this.switchToNormalMode();
        this.loadData(0, false);
    }

    getSelectedRecords() {
        return this.currentData.filter(record => this.selectedIds.has(record.id));
    }

    updateActionButtons() {
        const selectedRecords = this.getSelectedRecords();
        const activeSelected = selectedRecords.filter(r => !r.reception_moddt);
        const deletedSelected = selectedRecords.filter(r => r.reception_moddt);

        // 削除ボタン制御
        const deleteBtn = document.getElementById("delete-selected-btn");
        const restoreBtn = document.getElementById("restore-selected-btn");

        if (activeSelected.length > 0) {
            deleteBtn.style.display = "inline-block";
            document.getElementById("delete-count").textContent = activeSelected.length;
        } else {
            deleteBtn.style.display = "none";
        }

        if (deletedSelected.length > 0) {
            restoreBtn.style.display = "inline-block";
            document.getElementById("restore-count").textContent = deletedSelected.length;
        } else {
            restoreBtn.style.display = "none";
        }
    }

    setupEventListeners() {
        // 統合検索・フィルター実行ボタン
        document.getElementById("search-filter-execute-btn").addEventListener("click", () => {
            this.executeSearch();
        });

        // キーワード入力でEnterキー（両方の入力欄に対応）
        document.getElementById("content-keyword").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.executeSearch();
            }
        });

        document.getElementById("status-keyword").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.executeSearch();
            }
        });

        // フィルタークリアボタン
        document.getElementById("filter-clear-btn").addEventListener("click", () => {
            this.clearFilters();
        });

        // 重複データ検出ボタン
        document.getElementById("detect-duplicates-btn").addEventListener("click", () => {
            this.detectDuplicates();
        });

        // 通常表示に戻るボタン
        document.getElementById("back-to-normal").addEventListener("click", () => {
            this.returnToNormalMode();
        });

        // 削除ボタン
        document.getElementById("delete-selected-btn").addEventListener("click", () => {
            this.deleteSelected();
        });

        // 復元ボタン
        document.getElementById("restore-selected-btn").addEventListener("click", () => {
            this.restoreSelected();
        });

        // 全選択・全解除
        document.getElementById("select-all-btn").addEventListener("click", () => {
            this.selectAll();
        });

        document.getElementById("deselect-all-btn").addEventListener("click", () => {
            this.deselectAll();
        });

        // ページサイズ変更
        document.getElementById("page-size").addEventListener("change", () => {
            this.pagination.currentPage = 1;  // 最初のページに戻る
            if (this.displayMode === 'normal') {
                this.loadData(0, false);
            } else {
                this.displayDuplicatePage(0, false);
            }
        });

        // 削除済み表示チェックボックス
        document.getElementById("include-deleted-checkbox").addEventListener("change", (e) => {
            this.includeDeleted = e.target.checked;
            this.loadData(0, false);
        });

        // 自動スクロール
        this.setupAutoScroll();
        
        // ページングボタンのイベント設定
        this.setupPaginationEvents();
    }
    
    setupPaginationEvents() {
        // ページングボタン
        document.getElementById("first-page-btn").addEventListener("click", () => {
            this.goToFirstPage();
        });
        
        document.getElementById("prev-page-btn").addEventListener("click", () => {
            this.goToPrevPage();
        });
        
        document.getElementById("next-page-btn").addEventListener("click", () => {
            this.goToNextPage();
        });
        
        document.getElementById("last-page-btn").addEventListener("click", () => {
            this.goToLastPage();
        });
    }

    setupAutoScroll() {
        const tableContainer = document.getElementById("table-container");

        tableContainer.addEventListener("scroll", () => {
            // TableManagerの自動スクロール設定を確認
            const isAutoScrollEnabled = this.tableManager?.settings?.autoScroll ?? true;
            
            // 自動スクロールが無効の場合は処理しない
            if (!isAutoScrollEnabled) {
                return;
            }
            
            // 読み込み中は処理しない
            if (this.isLoading) return;
            
            const { scrollTop, scrollHeight, clientHeight } = tableContainer;
            const threshold = 200;

            if (scrollTop + clientHeight >= scrollHeight - threshold) {
                // 通常モードと重複モードで処理を分岐
                if (this.displayMode === 'normal' && this.hasMore) {
                    this.loadMoreData();
                } else if (this.displayMode === 'duplicate' && this.duplicateHasMore) {
                    this.loadMoreDuplicateData();
                }
            }
        });
    }

    async loadMoreData() {
        // 重複モード中は追加読み込みを無効化
        if (this.isDuplicateMode || this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        try {
            const newOffset = this.currentOffset + this.currentData.length;
            await this.loadData(newOffset, true);
        } catch (error) {
            console.error("追加データ読み込みエラー:", error);
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadMoreDuplicateData() {
        // 重複モード用の追加データ読み込み
        if (!this.duplicateHasMore || this.isLoading) return;
        
        this.isLoading = true;
        try {
            const pageSize = this.getPageSize();
            const newOffset = this.duplicateOffset + pageSize;
            this.displayDuplicatePage(newOffset, true);
        } catch (error) {
            console.error("重複データ追加読み込みエラー:", error);
        } finally {
            this.isLoading = false;
        }
    }

    // 統合された検索・フィルター実行メソッド
    async executeSearch() {
        this.currentFilters = this.getAllFilters();
        await this.loadData(0, false);
    }

    getAllFilters() {
        const filters = {};
        
        // 分離されたキーワード検索
        const contentKeyword = document.getElementById("content-keyword").value.trim();
        const statusKeyword = document.getElementById("status-keyword").value.trim();
        
        if (contentKeyword) filters.content_keyword = contentKeyword;
        if (statusKeyword) filters.status_keyword = statusKeyword;

        const progress = document.getElementById("progress").value;
        if (progress) filters.progress = progress;

        const systemType = document.getElementById("system-type").value;
        if (systemType) filters.system_type = systemType;

        const product = document.getElementById("product").value;
        if (product) filters.product = product;

        const dateFrom = document.getElementById("date-from").value;
        const dateTo = document.getElementById("date-to").value;
        if (dateFrom && dateTo) {
            filters.date_from = dateFrom + "T00:00:00";
            filters.date_to = dateTo + "T23:59:59";
        }

        return filters;
    }

    async clearFilters() {
        document.getElementById("content-keyword").value = "";
        document.getElementById("status-keyword").value = "";
        document.getElementById("progress").value = "";
        document.getElementById("system-type").value = "";
        document.getElementById("product").value = "";
        document.getElementById("date-from").value = "";
        document.getElementById("date-to").value = "";
        document.getElementById("include-deleted-checkbox").checked = false;

        this.currentFilters = {};
        this.includeDeleted = false;
        await this.loadData(0, false);
    }

    async detectDuplicates() {
        const duplicateType = document.getElementById("duplicate-type-select").value;
        const filters = this.getAllFilters();

        // TableManagerから重複検出用ソート設定を取得
        const sortParams = this.tableManager ? this.tableManager.getDuplicateSortParams(duplicateType) : {
            sort_by: "reception_datetime",
            sort_order: "desc"
        };

        // フィルター条件をログ出力（デバッグ用）
        console.log("=== 重複検出実行 ===");
        console.log("検出タイプ:", duplicateType);
        console.log("適用フィルター条件:", filters);
        console.log("ソート設定:", sortParams);
        console.log("削除済みデータ含む:", this.includeDeleted);

        try {
            this.showLoading(true);

            // フィルター条件に削除済みフラグとソート設定を追加
            const allFilters = {
                ...filters,
                include_deleted: this.includeDeleted,
                ...sortParams
            };

            const params = new URLSearchParams();
            Object.entries(allFilters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    params.append(key, value);
                }
            });

            console.log("API呼び出しパラメータ:", params.toString());

            const response = await fetch(`/api/duplicates/${duplicateType}?${params}`);

            if (!response.ok) {
                throw new Error("重複データの検出に失敗しました。");
            }

            const duplicateData = await response.json();
            console.log("重複検出結果:", duplicateData);
            
            this.displayDuplicates(duplicateData);
            
            // モードを重複表示に切り替え（トースト通知の代わり）
            this.switchToDuplicateMode(duplicateType, duplicateData);
            
        } catch (error) {
            console.error("重複検出エラー:", error);
            this.showError("重複データの検出に失敗しました。");
        } finally {
            this.showLoading(false);
        }
    }

    displayDuplicates(duplicateData) {
        // 全重複データをフラット化して保持
        this.duplicateAllData = [];
        duplicateData.duplicates.forEach(group => {
            group.records.forEach(record => {
                record.duplicate_group = group.group_id;
                this.duplicateAllData.push(record);
            });
        });

        this.totalCount = this.duplicateAllData.length;
        this.isDuplicateMode = true;
        this.selectedIds.clear();
        
        // ページング情報を初期化
        this.pagination.currentPage = 1;
        this.pagination.totalCount = this.totalCount;
        this.duplicateOffset = 0;
        
        // 最初のページを表示
        this.displayDuplicatePage(0, false);
    }
    
    displayDuplicatePage(offset, append = false) {
        const pageSize = this.getPageSize();
        const startIdx = offset;
        const endIdx = Math.min(offset + pageSize, this.duplicateAllData.length);
        
        if (append) {
            // 追加読み込みの場合
            const newData = this.duplicateAllData.slice(startIdx, endIdx);
            this.currentData = [...this.currentData, ...newData];
        } else {
            // 新規読み込みの場合
            this.currentData = this.duplicateAllData.slice(startIdx, endIdx);
        }
        
        this.duplicateOffset = offset;
        this.duplicateHasMore = endIdx < this.duplicateAllData.length;
        this.currentOffset = offset;  // 互換性のため
        this.hasMore = false;  // 通常モードの自動スクロールを無効化
        
        this.renderTable();
        this.updateCounts();
        this.updatePaginationInfo();
    }

    selectAll() {
        this.currentData.forEach(record => {
            this.selectedIds.add(record.id);
        });
        this.renderTable();
        this.updateCounts();
        this.updateActionButtons();
    }

    deselectAll() {
        this.selectedIds.clear();
        this.renderTable();
        this.updateCounts();
        this.updateActionButtons();
    }

    async deleteSelected() {
        if (this.selectedIds.size === 0) {
            this.showError("削除するデータが選択されていません。");
            return;
        }

        if (!confirm(`選択した${this.selectedIds.size}件のデータを削除しますか？`)) {
            return;
        }

        try {
            this.showLoading(true);

            const response = await fetch("/api/delete-duplicates", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    target_ids: Array.from(this.selectedIds),
                    delete_scope: "selected"
                }),
            });

            if (!response.ok) {
                throw new Error("削除処理に失敗しました。");
            }

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(`${result.deleted_count}件のデータを削除しました。`);
                await this.loadData(0, false);
            } else {
                this.showError("削除処理に失敗しました。");
            }
        } catch (error) {
            console.error("削除エラー:", error);
            this.showError("削除処理に失敗しました。");
        } finally {
            this.showLoading(false);
        }
    }

    async restoreSelected() {
        const selectedRecords = this.getSelectedRecords();
        const deletedSelected = selectedRecords.filter(r => r.reception_moddt);
        
        if (deletedSelected.length === 0) {
            this.showError("復元するデータが選択されていません。");
            return;
        }

        if (!confirm(`選択した${deletedSelected.length}件のデータを復元しますか？`)) {
            return;
        }

        try {
            this.showLoading(true);

            const response = await fetch("/api/restore-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target_ids: deletedSelected.map(r => r.id)
                })
            });

            if (!response.ok) {
                throw new Error("復元処理に失敗しました。");
            }

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(`${result.restored_count}件のデータを復元しました。`);
                await this.loadData(0, false);
            } else {
                this.showError("復元処理に失敗しました。");
            }
        } catch (error) {
            console.error("復元エラー:", error);
            this.showError("復元処理に失敗しました。");
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const indicator = document.getElementById("loading-indicator");
        if (indicator) {
            if (show) {
                indicator.classList.remove("hidden");
                indicator.innerHTML = '<span class="loading-spinner"></span> 読み込み中...';
            } else {
                indicator.classList.add("hidden");
            }
        }
    }

    // ページ遷移メソッド
    async goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.pagination.totalPages) return;
        
        this.pagination.currentPage = pageNumber;
        const offset = (pageNumber - 1) * this.pagination.pageSize;
        
        if (this.displayMode === 'normal') {
            await this.loadData(offset, false);
        } else {
            this.displayDuplicatePage(offset, false);
        }
    }
    
    async goToFirstPage() {
        await this.goToPage(1);
    }
    
    async goToPrevPage() {
        await this.goToPage(this.pagination.currentPage - 1);
    }
    
    async goToNextPage() {
        await this.goToPage(this.pagination.currentPage + 1);
    }
    
    async goToLastPage() {
        await this.goToPage(this.pagination.totalPages);
    }

    showError(message) {
        this.showToast(message, "error");
    }

    showSuccess(message) {
        this.showToast(message, "success");
    }

    showWarning(message) {
        this.showToast(message, "warning");
    }

    showToast(message, type) {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            ${message}
            <button class="toast-close">&times;</button>
        `;

        document.body.appendChild(toast);

        // 自動削除
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);

        // 手動削除
        toast.querySelector(".toast-close").addEventListener("click", () => {
            document.body.removeChild(toast);
        });
    }
}

// アプリケーション起動
document.addEventListener("DOMContentLoaded", () => {
    window.app = new DuplicateManagementApp();
});