from typing import List
from models.response_models import DeleteResponse
from models.request_models import DeleteRequest
from services.data_service import DataService
from database import db_manager
from datetime import datetime
from utils.operation_logger import OperationLogger

class DeleteService:
    @staticmethod
    def delete_duplicates(request: DeleteRequest) -> DeleteResponse:
        """重複データ削除"""

        if request.delete_scope == "selected":
            # 選択されたIDのみ削除
            target_ids = request.target_ids
        elif request.delete_scope == "filtered":
            # フィルター条件に合致するすべてのデータを削除
            # まずフィルター条件でIDを取得
            if request.filter_conditions:
                filter_where, filter_params = DataService.build_filter_conditions(request.filter_conditions)
                id_query = f"""
                SELECT recepthead.extentid AS id
                FROM recepthead
                LEFT JOIN exechead ON recepthead.receptno = exechead.receptno
                LEFT JOIN m_ctitem AS cond_item ON exechead.condition = cond_item.itemcd
                LEFT JOIN receptbody ON recepthead.receptno = receptbody.receptno
                LEFT JOIN execbody ON recepthead.receptno = execbody.receptno
                LEFT JOIN m_ctitem AS stype_item ON exechead.stype = stype_item.itemcd
                LEFT JOIN m_ctitem AS prod_item ON exechead.producttype = prod_item.itemcd
                WHERE recepthead.extentid IS NOT NULL
                AND extentid != 0
                AND (
                    recepthead.calldt >= '2015-01-01 00:00:00'
                    OR receptbody.moddt >= '2015-01-01 00:00:00'
                )
                {filter_where}
                """
                id_result = db_manager.execute_query(id_query, tuple(filter_params))
                target_ids = [row['id'] for row in id_result]
            else:
                target_ids = request.target_ids
        else:
            raise ValueError(f"Invalid delete_scope: {request.delete_scope}")

        if not target_ids:
            # 削除対象がない場合のログ出力
            operation_logger = OperationLogger.get_logger()
            operation_logger.log_delete_operation([], True, 0)
            return DeleteResponse(
                success=True,
                deleted_count=0,
                failed_ids=[],
                timestamp=datetime.now()
            )

        # 削除実行
        delete_query = """
        UPDATE recepthead
        SET receptmoddt = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo'
        WHERE extentid = ANY(%s)
        AND receptmoddt IS NULL
        """

        operation_logger = OperationLogger.get_logger()
        
        try:
            deleted_count = db_manager.execute_update(delete_query, (target_ids,))
            # 削除成功ログ出力
            operation_logger.log_delete_operation(target_ids, True, deleted_count)
            return DeleteResponse(
                success=True,
                deleted_count=deleted_count,
                failed_ids=[],
                timestamp=datetime.now()
            )
        except Exception as e:
            print(f"削除処理エラー: {e}")
            # 削除失敗ログ出力
            operation_logger.log_delete_operation(target_ids, False, error=str(e))
            return DeleteResponse(
                success=False,
                deleted_count=0,
                failed_ids=target_ids,
                timestamp=datetime.now()
            )