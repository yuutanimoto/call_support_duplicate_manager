from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ReceptionDataRecord(BaseModel):
    id: int
    content: Optional[str]
    status: Optional[str]
    result: Optional[str]
    report: Optional[str]
    progress: Optional[str]
    system_type: Optional[str]
    product: Optional[str]
    reception_moddt: Optional[datetime]
    reception_datetime: Optional[datetime]
    update_datetime: Optional[datetime]
    duplicate_count: Optional[int] = None
    duplicate_type: Optional[str] = None
    duplicate_key: Optional[str] = None

class StatisticsResponse(BaseModel):
    total_records: int      # 全体件数
    active_records: int     # 有効件数
    deleted_records: int    # 削除済み件数

class ReceptionDataResponse(BaseModel):
    data: List[ReceptionDataRecord]
    total: int
    offset: int
    limit: int
    has_more: bool
    statistics: Optional["StatisticsResponse"] = None

class DuplicateGroup(BaseModel):
    group_id: str
    duplicate_count: int
    duplicate_key: str
    records: List[ReceptionDataRecord]

class DuplicatesResponse(BaseModel):
    duplicates: List[DuplicateGroup]
    total_groups: int
    total_duplicates: int

class DeleteResponse(BaseModel):
    success: bool
    deleted_count: int
    failed_ids: List[int]
    timestamp: datetime

class MetadataResponse(BaseModel):
    progress_options: List[str]
    system_type_options: List[str]
    product_options: List[str]
    column_definitions: List[dict]

class RestoreResponse(BaseModel):
    success: bool
    restored_count: int
    failed_ids: List[int]
    timestamp: datetime

class ErrorResponse(BaseModel):
    error: bool = True
    error_code: str
    message: str
    details: Optional[dict] = None