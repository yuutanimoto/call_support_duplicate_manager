from fastapi import APIRouter, HTTPException
from models.response_models import DeleteResponse, MetadataResponse, RestoreResponse
from models.request_models import DeleteRequest, RestoreRequest
from services.delete_service import DeleteService
from services.restore_service import RestoreService
from database import db_manager

router = APIRouter()

@router.post("/delete-duplicates", response_model=DeleteResponse)
async def delete_duplicates(request: DeleteRequest):
    """重複データ削除API"""
    try:
        return DeleteService.delete_duplicates(request)
    except Exception as e:
        print(f"削除処理エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metadata", response_model=MetadataResponse)
async def get_metadata():
    """マスタデータ取得API"""
    try:
        # 進捗オプション取得
        progress_query = """
        SELECT DISTINCT cond_item.itemname
        FROM m_ctitem AS cond_item
        JOIN exechead ON exechead.condition = cond_item.itemcd
        WHERE cond_item.itemname IS NOT NULL
        ORDER BY cond_item.itemname
        """
        progress_result = db_manager.execute_query(progress_query)
        progress_options = [row['itemname'] for row in progress_result]

        # システム種別オプション取得
        system_type_query = """
        SELECT DISTINCT stype_item.itemname
        FROM m_ctitem AS stype_item
        JOIN exechead ON exechead.stype = stype_item.itemcd
        WHERE stype_item.itemname IS NOT NULL
        ORDER BY stype_item.itemname
        """
        system_type_result = db_manager.execute_query(system_type_query)
        system_type_options = [row['itemname'] for row in system_type_result]

        # 製品オプション取得
        product_query = """
        SELECT DISTINCT prod_item.itemname
        FROM m_ctitem AS prod_item
        JOIN exechead ON exechead.producttype = prod_item.itemcd
        WHERE prod_item.itemname IS NOT NULL
        ORDER BY prod_item.itemname
        """
        product_result = db_manager.execute_query(product_query)
        product_options = [row['itemname'] for row in product_result]

        # 列定義
        column_definitions = [
            {"id": "id", "name": "ID", "type": "number", "filterable": True, "sortable": True},
            {"id": "content", "name": "受付内容", "type": "text", "filterable": True, "sortable": True},
            {"id": "status", "name": "対応状況", "type": "text", "filterable": True, "sortable": True},
            {"id": "result", "name": "結果", "type": "text", "filterable": False, "sortable": True},
            {"id": "report", "name": "レポート", "type": "text", "filterable": False, "sortable": True},
            {"id": "progress", "name": "進捗", "type": "text", "filterable": True, "sortable": True},
            {"id": "system_type", "name": "システム種別", "type": "text", "filterable": True, "sortable": True},
            {"id": "product", "name": "製品", "type": "text", "filterable": True, "sortable": True},
            {"id": "reception_moddt", "name": "削除フラグ日時", "type": "datetime", "filterable": True, "sortable": True},
            {"id": "reception_datetime", "name": "受付日時", "type": "datetime", "filterable": True, "sortable": True},
            {"id": "update_datetime", "name": "更新日時", "type": "datetime", "filterable": True, "sortable": True}
        ]

        return MetadataResponse(
            progress_options=progress_options,
            system_type_options=system_type_options,
            product_options=product_options,
            column_definitions=column_definitions
        )

    except Exception as e:
        print(f"メタデータ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restore-records", response_model=RestoreResponse)
async def restore_records(request: RestoreRequest):
    """データ復元API"""
    try:
        return RestoreService.restore_records(request)
    except Exception as e:
        print(f"復元処理エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))