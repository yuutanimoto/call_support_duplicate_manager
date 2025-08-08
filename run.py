#!/usr/bin/env python3
"""
重複データ管理システム 起動スクリプト
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()

# アプリケーションのパスを追加
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def main():
    """アプリケーションを起動"""
    
    # 設定値を環境変数から取得
    host = os.getenv("APP_HOST", "0.0.0.0")
    port = int(os.getenv("APP_PORT", "8000"))
    debug = os.getenv("APP_DEBUG", "True").lower() == "true"
    
    print("=== 重複データ管理システム ===")
    print(f"起動中... http://{host}:{port}")
    print(f"デバッグモード: {'ON' if debug else 'OFF'}")
    print()
    
    try:
        # UvicornでFastAPIアプリケーションを起動
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            reload=debug,
            log_level="info" if debug else "warning",
            access_log=debug
        )
    except KeyboardInterrupt:
        print("\n=== システム終了 ===")
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()