import os
from typing import Optional

class LoggingConfig:
    """ログ設定の管理クラス"""
    
    @staticmethod
    def get_log_level() -> str:
        """ログレベルを環境変数から取得"""
        return os.getenv('LOG_LEVEL', 'INFO').upper()
    
    @staticmethod
    def get_log_dir() -> str:
        """ログディレクトリを環境変数から取得"""
        return os.getenv('LOG_DIR', 'logs')
    
    @staticmethod
    def get_max_bytes() -> int:
        """最大ファイルサイズを環境変数から取得（デフォルト: 10MB）"""
        try:
            return int(os.getenv('LOG_MAX_BYTES', '10485760'))  # 10MB
        except ValueError:
            return 10485760
    
    @staticmethod
    def get_backup_count() -> int:
        """バックアップファイル数を環境変数から取得（デフォルト: 2）"""
        try:
            return int(os.getenv('LOG_BACKUP_COUNT', '2'))
        except ValueError:
            return 2
    
    @staticmethod
    def is_debug_mode() -> bool:
        """デバッグモードかどうかを判定"""
        return os.getenv('APP_DEBUG', 'false').lower() in ('true', '1', 'yes', 'on')
    
    @staticmethod
    def get_log_format() -> str:
        """ログフォーマットを取得"""
        return os.getenv('LOG_FORMAT', '[%(levelname)s] %(asctime)s - %(message)s')
    
    @staticmethod
    def get_date_format() -> str:
        """日時フォーマットを取得"""
        return os.getenv('LOG_DATE_FORMAT', '%Y-%m-%d %H:%M:%S')