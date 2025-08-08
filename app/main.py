from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
sys.path.append(os.path.dirname(__file__))

from api import reception_data, duplicates, operations
from database import db_manager
from utils.operation_logger import OperationLogger
import os
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()

# FastAPIアプリケーション作成
app = FastAPI(
    title="重複データ管理システム",
    description="PostgreSQLから受信データの重複を検出・削除するWebアプリケーション",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静的ファイル設定
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# テンプレート設定
templates_dir = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=templates_dir)

# APIルーター登録
app.include_router(reception_data.router, prefix="/api", tags=["データ取得"])
app.include_router(duplicates.router, prefix="/api", tags=["重複検出"])
app.include_router(operations.router, prefix="/api", tags=["操作"])

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """メイン画面"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/system-diagram", response_class=HTMLResponse)
async def system_diagram(request: Request):
    """システム構成図画面"""
    return templates.TemplateResponse("system-diagram.html", {"request": request})

@app.get("/user-manual", response_class=HTMLResponse)
async def user_manual(request: Request):
    """ユーザーマニュアル画面"""
    return templates.TemplateResponse("user-manual.html", {"request": request})

@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    db_status = db_manager.test_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected"
    }

@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の処理"""
    print("=== 重複データ管理システム起動 ===")
    
    # ログシステム初期化
    try:
        OperationLogger.initialize()
        print("OK ログシステム初期化成功")
    except Exception as e:
        print(f"NG ログシステム初期化失敗: {e}")
    
    # データベース接続テスト
    if db_manager.test_connection():
        print("OK データベース接続成功")
    else:
        print("NG データベース接続失敗")
    
    print(f"アプリケーションが起動しました")
    print(f"URL: http://{os.getenv('APP_HOST', '0.0.0.0')}:{os.getenv('APP_PORT', '8000')}")

@app.on_event("shutdown")
async def shutdown_event():
    """アプリケーション終了時の処理"""
    print("アプリケーションを終了しています...")

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("APP_HOST", "0.0.0.0")
    port = int(os.getenv("APP_PORT", "8000"))
    debug = os.getenv("APP_DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )