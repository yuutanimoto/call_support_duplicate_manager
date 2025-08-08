# ログ出力機能 - 実装計画書

## 1. 技術仕様

### 1.1 ログライブラリ
- **Python標準ライブラリ**: `logging`
- **ローテーション**: `logging.handlers.RotatingFileHandler`
- **理由**: 外部依存なし、安定性、軽量

### 1.2 ログ設定
```python
import logging
from logging.handlers import RotatingFileHandler

# 設定例
logger = logging.getLogger('operation_logger')
handler = RotatingFileHandler(
    'logs/operation.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=2,          # 3ファイル (現在 + 2バックアップ)
    encoding='utf-8'
)
formatter = logging.Formatter(
    '[%(levelname)s] %(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
```

## 2. ファイル構成

### 2.1 新規作成ファイル

#### `app/utils/operation_logger.py`
```
ログ出力の共通ユーティリティクラス
- OperationLogger クラス
- ログ設定の初期化
- 削除・復元操作のログ出力メソッド
```

#### `logs/` ディレクトリ
```
ログファイル出力ディレクトリ
- operation.log (アクティブファイル)
- operation.log.1 (第1世代バックアップ)
- operation.log.2 (第2世代バックアップ)
```

#### `app/config/logging_config.py`
```
ログ設定の外部化
- ログレベル設定
- ファイルパス設定
- 環境変数からの設定読み込み
```

### 2.2 既存ファイルの修正

#### `app/services/delete_service.py`
- OperationLoggerのインポート
- delete_duplicates()メソッドにログ出力追加
- 成功・失敗時のログ記録

#### `app/services/restore_service.py`
- OperationLoggerのインポート  
- restore_records()メソッドにログ出力追加
- 成功・失敗時のログ記録

## 3. 実装詳細

### 3.1 OperationLoggerクラス設計

```python
class OperationLogger:
    def __init__(self, log_dir: str = "logs", max_bytes: int = 10*1024*1024, backup_count: int = 2):
        """ログ設定の初期化"""
        
    def log_delete_operation(self, target_ids: List[int], success: bool, deleted_count: int = 0, error: str = None):
        """削除操作のログ出力"""
        
    def log_restore_operation(self, target_ids: List[int], success: bool, restored_count: int = 0, error: str = None):
        """復元操作のログ出力"""
        
    @staticmethod
    def get_logger() -> 'OperationLogger':
        """シングルトンパターンでロガーを取得"""
```

### 3.2 ログフォーマット

#### 成功時のログ
```python
# 削除成功
f"SUCCESS: Deleted extentids: {target_ids} ({deleted_count} records)"

# 復元成功  
f"SUCCESS: Restored extentids: {target_ids} ({restored_count} records)"
```

#### 失敗時のログ
```python
# 削除失敗
f"ERROR: Failed to delete extentids: {target_ids} - {error_message}"

# 復元失敗
f"ERROR: Failed to restore extentids: {target_ids} - {error_message}"
```

### 3.3 統合ポイント

#### DeleteService修正箇所
```python
# app/services/delete_service.py:63-76
try:
    deleted_count = db_manager.execute_update(delete_query, (target_ids,))
    
    # ログ出力追加
    operation_logger.log_delete_operation(target_ids, True, deleted_count)
    
    return DeleteResponse(...)
except Exception as e:
    # ログ出力追加
    operation_logger.log_delete_operation(target_ids, False, error=str(e))
    
    return DeleteResponse(...)
```

#### RestoreService修正箇所
```python  
# app/services/restore_service.py:28-46
try:
    restored_count = db_manager.execute_update(restore_query, (request.target_ids,))
    
    # ログ出力追加
    operation_logger.log_restore_operation(request.target_ids, True, restored_count)
    
    return RestoreResponse(...)
except Exception as e:
    # ログ出力追加
    operation_logger.log_restore_operation(request.target_ids, False, error=str(e))
    
    return RestoreResponse(...)
```

## 4. 環境設定

### 4.1 環境変数 (.env)
```bash
# ログ設定
LOG_LEVEL=INFO
LOG_DIR=logs
LOG_MAX_BYTES=10485760  # 10MB
LOG_BACKUP_COUNT=2
```

### 4.2 ディレクトリ作成
```bash
# ログディレクトリの作成
mkdir logs
chmod 755 logs
```

## 5. テスト計画

### 5.1 単体テスト
- `test_operation_logger.py`
  - ログファイル作成テスト
  - ローテーションテスト
  - フォーマットテスト

### 5.2 統合テスト  
- DeleteService経由でのログ出力テスト
- RestoreService経由でのログ出力テスト
- 大量データでのパフォーマンステスト

### 5.3 異常系テスト
- ログディレクトリ権限エラー
- ディスク容量不足
- ログファイル削除・移動エラー

## 6. 実装順序

1. **Phase 1**: ログユーティリティ作成
   - `app/utils/operation_logger.py` 実装
   - `app/config/logging_config.py` 実装
   - 単体テスト作成・実行

2. **Phase 2**: サービス層統合
   - `delete_service.py` 修正
   - `restore_service.py` 修正
   - ログディレクトリ作成

3. **Phase 3**: 統合テスト
   - API経由でのログ出力確認
   - ローテーション機能確認
   - パフォーマンステスト

## 7. リスク・対策

### 7.1 パフォーマンスリスク
- **リスク**: ログI/Oによるレスポンス劣化
- **対策**: 非同期ログ出力の検討、バッファリング

### 7.2 ディスク容量リスク  
- **リスク**: ログファイルによるディスク容量枯渇
- **対策**: 定期的な古いログ削除、監視アラート

### 7.3 権限エラーリスク
- **リスク**: ログディレクトリへの書き込み権限不足
- **対策**: セットアップ時の権限確認、エラーハンドリング

## 8. 運用・保守

### 8.1 ログ監視
- ログファイルサイズ監視
- エラーログの監視・アラート
- ローテーション正常動作確認

### 8.2 設定管理
- 環境別設定の管理
- ログレベルの動的変更
- 設定変更時の影響範囲確認

### 8.3 トラブルシューティング
- ログ出力エラー時の対応手順
- ファイルローテーション失敗時の復旧手順
- パフォーマンス劣化時の調査手順