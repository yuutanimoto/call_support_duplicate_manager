from fastapi import APIRouter, Path, Query, HTTPException
from typing import Optional
from datetime import datetime
from models.response_models import DuplicatesResponse
from models.request_models import FilterRequest
from services.duplicate_service import DuplicateService

router = APIRouter()

@router.get("/duplicates/{duplicate_type}", response_model=DuplicatesResponse)
async def detect_duplicates(
    duplicate_type: str = Path(..., regex="^(exact|content|status)$", description="重複タイプ"),
    keyword: Optional[str] = Query(None, description="キーワード検索（後方互換性）"),
    content_keyword: Optional[str] = Query(None, description="受付内容キーワード"),
    status_keyword: Optional[str] = Query(None, description="対応状況キーワード"),
    progress: Optional[str] = Query(None, description="進捗フィルター"),
    system_type: Optional[str] = Query(None, description="システム種別フィルター"),
    product: Optional[str] = Query(None, description="製品フィルター"),
    date_from: Optional[str] = Query(None, description="開始日時"),
    date_to: Optional[str] = Query(None, description="終了日時"),
    date_field: str = Query("reception_datetime", description="日付フィルター対象"),
    include_deleted: bool = Query(False, description="削除済みデータを含む")
):
    """重複データ検出API"""
    try:
        # 日付文字列をdatetimeオブジェクトに変換
        date_from_dt = None
        date_to_dt = None
        if date_from:
            date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        if date_to:
            date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))

        # フィルター条件構築
        filters = None
        if any([keyword, content_keyword, status_keyword, progress, system_type, product, date_from_dt, date_to_dt, include_deleted]):
            filters = FilterRequest(
                keyword=keyword,
                content_keyword=content_keyword,
                status_keyword=status_keyword,
                progress=progress,
                system_type=system_type,
                product=product,
                date_from=date_from_dt,
                date_to=date_to_dt,
                date_field=date_field,
                include_deleted=include_deleted
            )

        # 重複検出
        duplicate_groups = DuplicateService.detect_duplicates(duplicate_type, filters)

        total_duplicates = sum(len(group.records) for group in duplicate_groups)

        return DuplicatesResponse(
            duplicates=duplicate_groups,
            total_groups=len(duplicate_groups),
            total_duplicates=total_duplicates
        )

    except Exception as e:
        print(f"重複検出エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))