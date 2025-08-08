from typing import List
from models.response_models import RestoreResponse
from models.request_models import RestoreRequest
from database import db_manager
from datetime import datetime
from utils.operation_logger import OperationLogger

class RestoreService:
    @staticmethod
    def restore_records(request: RestoreRequest) -> RestoreResponse:
        """削除済みデータの復元"""
        
        if not request.target_ids:
            # 復元対象がない場合のログ出力
            operation_logger = OperationLogger.get_logger()
            operation_logger.log_restore_operation([], True, 0)
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

        operation_logger = OperationLogger.get_logger()
        
        try:
            restored_count = db_manager.execute_update(
                restore_query, (request.target_ids,)
            )
            # 復元成功ログ出力
            operation_logger.log_restore_operation(request.target_ids, True, restored_count)
            
            return RestoreResponse(
                success=True,
                restored_count=restored_count,
                failed_ids=[],
                timestamp=datetime.now()
            )
        except Exception as e:
            print(f"復元処理エラー: {e}")
            # 復元失敗ログ出力
            operation_logger.log_restore_operation(request.target_ids, False, error=str(e))
            return RestoreResponse(
                success=False,
                restored_count=0,
                failed_ids=request.target_ids,
                timestamp=datetime.now()
            )