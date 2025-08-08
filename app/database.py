import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import os
from typing import Generator
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.host = os.getenv("DB_HOST", "192.168.225.91")
        self.database = os.getenv("DB_NAME", "mcsystem")
        self.user = os.getenv("DB_USER", "mcqc")
        self.password = os.getenv("DB_PASSWORD", "qc5143720")
        self.port = os.getenv("DB_PORT", "5432")

    @contextmanager
    def get_connection(self) -> Generator[psycopg2.extensions.connection, None, None]:
        """データベース接続のコンテキストマネージャー"""
        conn = None
        try:
            conn = psycopg2.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password,
                port=self.port,
                cursor_factory=RealDictCursor
            )
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()

    def execute_query(self, query: str, params: tuple = None):
        """クエリ実行"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()

    def execute_update(self, query: str, params: tuple = None) -> int:
        """更新クエリ実行"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount

    def test_connection(self) -> bool:
        """データベース接続テスト"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    return True
        except Exception as e:
            print(f"データベース接続エラー: {e}")
            return False

# シングルトンインスタンス
db_manager = DatabaseManager()