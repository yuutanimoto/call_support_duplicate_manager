from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FilterRequest(BaseModel):
    keyword: Optional[str] = None  # 後方互換性のために保持
    content_keyword: Optional[str] = None  # 受付内容キーワード
    status_keyword: Optional[str] = None   # 対応状況キーワード
    progress: Optional[str] = None
    system_type: Optional[str] = None
    product: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    date_field: Optional[str] = "reception_datetime"
    include_deleted: bool = False

class DeleteRequest(BaseModel):
    target_ids: List[int]
    delete_scope: str = "selected"  # "selected" or "filtered"
    filter_conditions: Optional[FilterRequest] = None

class RestoreRequest(BaseModel):
    target_ids: List[int]  # 復元対象ID一覧