from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime
from models.response_models import ReceptionDataResponse, StatisticsResponse
from models.request_models import FilterRequest
from services.data_service import DataService

router = APIRouter()

@router.get("/reception-data", response_model=ReceptionDataResponse)
async def get_reception_data(
    offset: int = Query(0, ge=0, description="データ開始位置"),
    limit: int = Query(100, ge=1, le=500, description="取得件数"),
    sort_by: str = Query("reception_datetime", description="ソート列（カンマ区切りで複数指定可）"),
    sort_order: str = Query("desc", description="ソート順（カンマ区切りで複数指定可）"),
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
    """受信データ取得API"""
    try:
        # ソートパラメータの検証（セキュリティ対策）
        if sort_order:
            # カンマ区切りの各要素が asc または desc であることを確認
            sort_orders = [s.strip().lower() for s in sort_order.split(',')]
            for order in sort_orders:
                if order not in ('asc', 'desc'):
                    raise HTTPException(status_code=400, detail=f"Invalid sort order: {order}")
            sort_order = ','.join(sort_orders)
        
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

        # データ取得
        records, total = DataService.get_reception_data(
            offset=offset,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            filters=filters
        )

        # 統計情報取得
        stats = DataService.get_statistics(filters)

        return ReceptionDataResponse(
            data=records,
            total=total,
            offset=offset,
            limit=limit,
            has_more=offset + limit < total,
            statistics=StatisticsResponse(**stats)
        )

    except Exception as e:
        print(f"データ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))