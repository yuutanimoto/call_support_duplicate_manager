# 実装計画書：削除データ表示制御と復元機能

## 1. 実装概要

### 1.1 実装方針
- **段階的実装**: 機能単位で段階的にリリース
- **後方互換性**: 既存APIの互換性を維持
- **パフォーマンス重視**: データベースクエリの最適化を優先

### 1.2 実装フェーズ
- **フェーズ1**: 削除済みデータ表示制御機能
- **フェーズ2**: 復元機能の実装
- **フェーズ3**: UI/UXの改善

## 2. フェーズ1：削除済みデータ表示制御機能

### 2.1 バックエンド実装

#### 2.1.1 データサービス拡張
**ファイル**: `app/services/data_service.py`

```python
# FilterRequestモデルにinclude_deletedフィールド追加
class FilterRequest(BaseModel):
    # 既存フィールド...
    include_deleted: bool = False  # 削除済みデータ表示フラグ

# build_filter_conditions修正
def build_filter_conditions(filters: FilterRequest) -> Tuple[str, list]:
    conditions = []
    params = []
    
    # 既存のフィルター条件...
    
    # 削除済みデータ制御
    if not filters.include_deleted:
        conditions.append("recepthead.receptmoddt IS NULL")
    
    # 条件結合
    where_clause = ""
    if conditions:
        where_clause = "AND " + " AND ".join(conditions)
    
    return where_clause, params
```

#### 2.1.2 統計情報取得API
**ファイル**: `app/api/operations.py`

```python
@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics(
    keyword: Optional[str] = Query(None),
    progress: Optional[str] = Query(None),
    system_type: Optional[str] = Query(None),
    product: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    date_field: str = Query("reception_datetime")
):
    """統計情報取得API"""
    filters = build_filter_request(...)
    
    # 全体統計
    total_active = count_records(filters, include_deleted=False)
    total_deleted = count_records(filters, include_deleted=True) - total_active
    total_all = total_active + total_deleted
    
    return StatisticsResponse(
        total_records=total_all,
        active_records=total_active,
        deleted_records=total_deleted
    )
```

#### 2.1.3 データモデル拡張
**ファイル**: `app/models/response_models.py`

```python
class StatisticsResponse(BaseModel):
    total_records: int      # 全体件数
    active_records: int     # 有効件数
    deleted_records: int    # 削除済み件数

class ReceptionDataResponse(BaseModel):
    data: List[ReceptionDataRecord]
    total: int
    offset: int
    limit: int
    has_more: bool
    statistics: StatisticsResponse  # 統計情報追加
```

### 2.2 フロントエンド実装

#### 2.2.1 UI要素追加
**ファイル**: `app/templates/index.html`

```html
<!-- フィルターセクションに追加 -->
<div class="filter-row">
    <div class="form-group">
        <label>
            <input type="checkbox" id="include-deleted-checkbox">
            削除済みデータを表示する
        </label>
    </div>
</div>

<!-- 統計情報表示の改善 -->
<div class="table-info">
    <span>表示: </span>
    <select id="page-size">...</select>
    <span>件</span>
    <div id="statistics-display">
        全レコード: <span id="total-all">0</span>件 
        (有効: <span id="total-active">0</span>件 / 削除済み: <span id="total-deleted">0</span>件)
    </div>
    <span id="data-range">0-0件目</span>
</div>
```

#### 2.2.2 JavaScript実装
**ファイル**: `app/static/js/app.js`

```javascript
class DuplicateManagementApp {
    constructor() {
        // 既存プロパティ...
        this.includeDeleted = false;  // 削除済み表示フラグ
        this.statistics = null;       // 統計情報
    }

    setupEventListeners() {
        // 既存イベント...
        
        // 削除済み表示チェックボックス
        document.getElementById("include-deleted-checkbox")
            .addEventListener("change", (e) => {
                this.includeDeleted = e.target.checked;
                this.loadData(0, false);
            });
    }

    getFilters() {
        const filters = {
            // 既存フィルター...
            include_deleted: this.includeDeleted
        };
        return filters;
    }

    async loadStatistics() {
        const filters = this.getFilters();
        const params = new URLSearchParams(filters);
        
        const response = await fetch(`/api/statistics?${params}`);
        this.statistics = await response.json();
        this.updateStatisticsDisplay();
    }

    updateStatisticsDisplay() {
        if (this.statistics) {
            document.getElementById("total-all").textContent = 
                this.statistics.total_records.toLocaleString();
            document.getElementById("total-active").textContent = 
                this.statistics.active_records.toLocaleString();
            document.getElementById("total-deleted").textContent = 
                this.statistics.deleted_records.toLocaleString();
        }
    }
}
```

#### 2.2.3 CSS追加
**ファイル**: `app/static/css/style.css`

```css
/* 削除済みデータの視覚的区別 */
.deleted-row {
    background-color: #f5f5f5;
    opacity: 0.7;
}

.deleted-row td {
    color: #666;
}

/* 統計情報表示 */
.statistics-display {
    font-size: 0.9em;
    margin: 0.5em 0;
}

.statistics-display .deleted-count {
    color: #dc3545;
}

.statistics-display .active-count {
    color: #28a745;
}
```

## 3. フェーズ2：復元機能の実装

### 3.1 バックエンド実装

#### 3.1.1 復元サービス
**ファイル**: `app/services/restore_service.py`

```python
from typing import List
from models.response_models import RestoreResponse
from models.request_models import RestoreRequest
from database import db_manager
from datetime import datetime

class RestoreService:
    @staticmethod
    def restore_records(request: RestoreRequest) -> RestoreResponse:
        """削除済みデータの復元"""
        
        if not request.target_ids:
            return RestoreResponse(
                success=True,
                restored_count=0,
                failed_ids=[],
                timestamp=datetime.now()
            )

        # 復元クエリ（削除済みデータのみ対象）
        restore_query = """
        UPDATE recepthead
        SET receptmoddt = NULL
        WHERE extentid = ANY(%s)
        AND receptmoddt IS NOT NULL
        """

        try:
            restored_count = db_manager.execute_update(
                restore_query, (request.target_ids,)
            )
            
            return RestoreResponse(
                success=True,
                restored_count=restored_count,
                failed_ids=[],
                timestamp=datetime.now()
            )
        except Exception as e:
            return RestoreResponse(
                success=False,
                restored_count=0,
                failed_ids=request.target_ids,
                timestamp=datetime.now()
            )
```

#### 3.1.2 復元API追加
**ファイル**: `app/api/operations.py`

```python
from services.restore_service import RestoreService
from models.request_models import RestoreRequest
from models.response_models import RestoreResponse

@router.post("/restore-records", response_model=RestoreResponse)
async def restore_records(request: RestoreRequest):
    """データ復元API"""
    try:
        return RestoreService.restore_records(request)
    except Exception as e:
        print(f"復元処理エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

#### 3.1.3 データモデル追加
**ファイル**: `app/models/request_models.py`

```python
class RestoreRequest(BaseModel):
    target_ids: List[int]  # 復元対象ID一覧
```

**ファイル**: `app/models/response_models.py`

```python
class RestoreResponse(BaseModel):
    success: bool
    restored_count: int
    failed_ids: List[int]
    timestamp: datetime
```

### 3.2 フロントエンド実装

#### 3.2.1 UI動的制御
**ファイル**: `app/templates/index.html`

```html
<!-- 削除・復元ボタンエリア（動的表示） -->
<div class="delete-actions">
    <button id="select-all-btn" class="btn btn-secondary">すべて選択</button>
    <button id="deselect-all-btn" class="btn btn-secondary">すべて解除</button>
    
    <!-- 削除ボタン（有効データ選択時） -->
    <button id="delete-selected-btn" class="btn btn-danger" style="display: none;">
        選択したデータを削除 (<span id="delete-count">0</span>件)
    </button>
    
    <!-- 復元ボタン（削除済みデータ選択時） -->
    <button id="restore-selected-btn" class="btn btn-success" style="display: none;">
        選択したデータを復元 (<span id="restore-count">0</span>件)
    </button>
</div>
```

#### 3.2.2 JavaScript機能拡張
**ファイル**: `app/static/js/app.js`

```javascript
class DuplicateManagementApp {
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

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(`${result.restored_count}件のデータを復元しました。`);
                await this.loadData(0, false);
            } else {
                this.showError("復元処理に失敗しました。");
            }
        } catch (error) {
            this.showError("復元処理に失敗しました。");
        } finally {
            this.showLoading(false);
        }
    }
}
```

## 4. フェーズ3：UI/UX改善

### 4.1 テーブル表示改善

#### 4.1.1 行スタイル制御
```javascript
renderTable() {
    // 既存の描画ロジック...
    
    this.currentData.forEach(record => {
        const row = document.createElement("tr");
        
        // 削除済みデータの視覚的区別
        if (record.reception_moddt) {
            row.classList.add("deleted-row");
        }
        
        // 既存の描画ロジック...
    });
}
```

#### 4.1.2 ステータス表示改善
```javascript
updateCounts() {
    const activeRecords = this.currentData.filter(r => !r.reception_moddt);
    const deletedRecords = this.currentData.filter(r => r.reception_moddt);
    
    document.getElementById("current-count").textContent = 
        `${this.currentData.length} (有効: ${activeRecords.length} / 削除済み: ${deletedRecords.length})`;
    
    // 選択状態の更新
    this.updateSelectionCounts();
}
```

## 5. データベース最適化

### 5.1 インデックス確認
```sql
-- receptmoddt用のインデックス存在確認・作成
CREATE INDEX IF NOT EXISTS idx_recepthead_receptmoddt 
ON recepthead(receptmoddt);

-- 複合インデックス（extentid, receptmoddt）
CREATE INDEX IF NOT EXISTS idx_recepthead_extentid_receptmoddt 
ON recepthead(extentid, receptmoddt);
```

### 5.2 クエリ最適化
- 削除状態フィルター適用時のEXPLAIN ANALYZE実行
- 統計情報取得クエリの最適化
- ページネーション性能の確認

## 6. テスト計画

### 6.1 単体テスト
- [ ] 削除済みフィルター機能のテスト
- [ ] 復元機能のテスト  
- [ ] 統計情報取得のテスト

### 6.2 統合テスト
- [ ] フィルター適用後の削除・復元操作
- [ ] 重複検出との連携テスト
- [ ] ページネーション動作テスト

### 6.3 性能テスト
- [ ] 大量削除済みデータでの表示性能
- [ ] 削除済みフィルター適用時の検索性能
- [ ] 統計情報取得の性能

## 7. リリース計画

### 7.1 段階的リリース
1. **Phase 1**: 削除済み表示制御（1週間）
2. **Phase 2**: 復元機能（1週間） 
3. **Phase 3**: UI/UX改善（3日）
4. **総合テスト・調整**（2日）

### 7.2 リリース前チェックリスト
- [ ] 全機能の動作確認
- [ ] パフォーマンステスト完了
- [ ] 後方互換性確認
- [ ] ドキュメント更新
- [ ] ユーザーガイド作成

## 8. 運用・保守

### 8.1 監視項目
- 削除・復元操作の頻度
- 削除済みデータ表示時の性能メトリクス
- エラー発生率の監視

### 8.2 今後の拡張可能性
- 削除・復元操作のログ記録機能
- バッチ復元機能
- 削除済みデータの物理削除機能
- 権限制御の追加