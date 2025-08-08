import logging
import os
from logging.handlers import RotatingFileHandler
from typing import List, Optional
from datetime import datetime

class OperationLogger:
    _instance: Optional['OperationLogger'] = None
    _logger: Optional[logging.Logger] = None

    def __init__(self, log_dir: str = "logs", max_bytes: int = 10*1024*1024, backup_count: int = 2):
        """ログ設定の初期化"""
        if OperationLogger._instance is not None:
            raise Exception("OperationLogger is a singleton class. Use get_logger() method.")
        
        self.log_dir = log_dir
        self.max_bytes = max_bytes
        self.backup_count = backup_count
        self._setup_logger()
        OperationLogger._instance = self

    def _setup_logger(self):
        """ログ設定の初期化"""
        # ログディレクトリの作成
        if not os.path.exists(self.log_dir):
            try:
                os.makedirs(self.log_dir, exist_ok=True)
            except OSError as e:
                print(f"ログディレクトリ作成エラー: {e}")
                return

        # ロガーの設定
        self._logger = logging.getLogger('operation_logger')
        self._logger.setLevel(logging.INFO)
        
        # 既存のハンドラーをクリア
        if self._logger.handlers:
            self._logger.handlers.clear()

        # ローテーティングファイルハンドラーの設定
        log_file_path = os.path.join(self.log_dir, 'operation.log')
        try:
            handler = RotatingFileHandler(
                log_file_path,
                maxBytes=self.max_bytes,
                backupCount=self.backup_count,
                encoding='utf-8'
            )
            
            # ログフォーマットの設定
            formatter = logging.Formatter(
                '[%(levelname)s] %(asctime)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)
            self._logger.addHandler(handler)
            
        except Exception as e:
            print(f"ログハンドラー設定エラー: {e}")

    def log_delete_operation(self, target_ids: List[int], success: bool, deleted_count: int = 0, error: str = None):
        """削除操作のログ出力"""
        if not self._logger:
            return
            
        try:
            # IDリストが大量の場合は件数のみ表示
            if len(target_ids) > 10:
                ids_display = f"[{len(target_ids)} IDs: {target_ids[0]}...{target_ids[-1]}]"
            else:
                ids_display = str(target_ids)
                
            if success:
                message = f"SUCCESS: Deleted extentids: {ids_display} ({deleted_count} records)"
                self._logger.info(f"[DELETE] {message}")
            else:
                error_msg = error if error else "Unknown error"
                message = f"ERROR: Failed to delete extentids: {ids_display} - {error_msg}"
                self._logger.error(f"[DELETE] {message}")
        except Exception as e:
            print(f"削除ログ出力エラー: {e}")

    def log_restore_operation(self, target_ids: List[int], success: bool, restored_count: int = 0, error: str = None):
        """復元操作のログ出力"""
        if not self._logger:
            return
            
        try:
            # IDリストが大量の場合は件数のみ表示
            if len(target_ids) > 10:
                ids_display = f"[{len(target_ids)} IDs: {target_ids[0]}...{target_ids[-1]}]"
            else:
                ids_display = str(target_ids)
                
            if success:
                message = f"SUCCESS: Restored extentids: {ids_display} ({restored_count} records)"
                self._logger.info(f"[RESTORE] {message}")
            else:
                error_msg = error if error else "Unknown error"
                message = f"ERROR: Failed to restore extentids: {ids_display} - {error_msg}"
                self._logger.error(f"[RESTORE] {message}")
        except Exception as e:
            print(f"復元ログ出力エラー: {e}")

    @staticmethod
    def get_logger() -> 'OperationLogger':
        """シングルトンパターンでロガーを取得"""
        if OperationLogger._instance is None:
            OperationLogger._instance = OperationLogger()
        return OperationLogger._instance

    @staticmethod
    def initialize(log_dir: str = "logs", max_bytes: int = 10*1024*1024, backup_count: int = 2):
        """ロガーを初期化（アプリケーション起動時に呼び出し）"""
        if OperationLogger._instance is None:
            OperationLogger._instance = OperationLogger(log_dir, max_bytes, backup_count)
        return OperationLogger._instance