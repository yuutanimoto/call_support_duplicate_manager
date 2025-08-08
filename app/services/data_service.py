from typing import List, Optional, Tuple
from models.response_models import ReceptionDataRecord
from models.request_models import FilterRequest
from database import db_manager

class DataService:
    @staticmethod
    def build_filter_conditions(filters: FilterRequest) -> Tuple[str, list]:
        """フィルター条件を構築"""
        conditions = []
        params = []

        # 新しい分離型キーワード検索
        if filters.content_keyword:
            conditions.append("receptbody.rdata ILIKE %s")
            params.append(f"%{filters.content_keyword}%")

        if filters.status_keyword:
            conditions.append("COALESCE(execbody.execstate, '') ILIKE %s")
            params.append(f"%{filters.status_keyword}%")

        # 後方互換性：既存keywordが使用されている場合
        if filters.keyword and not filters.content_keyword and not filters.status_keyword:
            conditions.append("""
                (receptbody.rdata ILIKE %s
                 OR COALESCE(execbody.execstate, '') ILIKE %s)
            """)
            keyword_param = f"%{filters.keyword}%"
            params.extend([keyword_param, keyword_param])

        if filters.progress:
            conditions.append("cond_item.itemname = %s")
            params.append(filters.progress)

        if filters.system_type:
            conditions.append("stype_item.itemname = %s")
            params.append(filters.system_type)

        if filters.product:
            conditions.append("prod_item.itemname = %s")
            params.append(filters.product)

        if filters.date_from and filters.date_to:
            if filters.date_field == "reception_datetime":
                conditions.append("recepthead.calldt BETWEEN %s AND %s")
            elif filters.date_field == "update_datetime":
                conditions.append("COALESCE(receptbody.moddt, recepthead.calldt) BETWEEN %s AND %s")
            elif filters.date_field == "reception_moddt":
                conditions.append("recepthead.receptmoddt BETWEEN %s AND %s")
            params.extend([filters.date_from, filters.date_to])

        # 削除済みデータ制御
        if not filters.include_deleted:
            conditions.append("recepthead.receptmoddt IS NULL")

        where_clause = ""
        if conditions:
            where_clause = "AND " + " AND ".join(conditions)

        return where_clause, params

    @staticmethod
    def get_reception_data(
        offset: int = 0,
        limit: int = 100,
        sort_by: str = "reception_datetime",
        sort_order: str = "desc",
        filters: Optional[FilterRequest] = None
    ) -> Tuple[List[ReceptionDataRecord], int]:
        """受信データ取得"""

        # フィルター条件構築
        filter_where, filter_params = "", []
        if filters:
            filter_where, filter_params = DataService.build_filter_conditions(filters)

        # 総件数取得
        count_query = f"""
        SELECT COUNT(*)
        FROM recepthead
        LEFT JOIN m_emp ON recepthead.receptempcd = m_emp.empcd
        LEFT JOIN exechead ON recepthead.receptno = exechead.receptno
        LEFT JOIN m_ctitem AS cond_item ON exechead.condition = cond_item.itemcd
        LEFT JOIN receptbody ON recepthead.receptno = receptbody.receptno
        LEFT JOIN execbody ON recepthead.receptno = execbody.receptno
        LEFT JOIN m_ctitem AS stype_item ON exechead.stype = stype_item.itemcd
        LEFT JOIN m_ctitem AS prod_item ON exechead.producttype = prod_item.itemcd
        WHERE recepthead.extentid IS NOT NULL
        AND extentid != 0
        AND (
            recepthead.calldt >= '2015-01-01 00:00:00'
            OR receptbody.moddt >= '2015-01-01 00:00:00'
        )
        {filter_where}
        """

        total_result = db_manager.execute_query(count_query, tuple(filter_params))
        total = total_result[0]['count']

        # データ取得
        data_query = f"""
        SELECT
            recepthead.extentid AS id,
            receptbody.rdata AS content,
            COALESCE(execbody.execstate, '') AS status,
            COALESCE(execbody.execresult, '') AS result,
            COALESCE(execbody.execinfo, '') AS report,
            cond_item.itemname AS progress,
            stype_item.itemname AS system_type,
            prod_item.itemname AS product,
            recepthead.receptmoddt AT TIME ZONE 'Asia/Tokyo' AS reception_moddt,
            recepthead.calldt AT TIME ZONE 'Asia/Tokyo' AS reception_datetime,
            COALESCE(receptbody.moddt, recepthead.calldt) AT TIME ZONE 'Asia/Tokyo' AS update_datetime
        FROM recepthead
        LEFT JOIN m_emp ON recepthead.receptempcd = m_emp.empcd
        LEFT JOIN exechead ON recepthead.receptno = exechead.receptno
        LEFT JOIN m_ctitem AS cond_item ON exechead.condition = cond_item.itemcd
        LEFT JOIN receptbody ON recepthead.receptno = receptbody.receptno
        LEFT JOIN execbody ON recepthead.receptno = execbody.receptno
        LEFT JOIN m_ctitem AS stype_item ON exechead.stype = stype_item.itemcd
        LEFT JOIN m_ctitem AS prod_item ON exechead.producttype = prod_item.itemcd
        WHERE recepthead.extentid IS NOT NULL
        AND extentid != 0
        AND (
            recepthead.calldt >= '2015-01-01 00:00:00'
            OR receptbody.moddt >= '2015-01-01 00:00:00'
        )
        {filter_where}
        ORDER BY {sort_by} {sort_order.upper()}
        LIMIT %s OFFSET %s
        """

        data_params = filter_params + [limit, offset]
        data_result = db_manager.execute_query(data_query, tuple(data_params))

        records = [ReceptionDataRecord(**row) for row in data_result]
        return records, total
    
    @staticmethod
    def get_statistics(filters: Optional[FilterRequest] = None) -> dict:
        """統計情報取得"""
        
        # 基本的なフィルター条件（削除状態制御を除外）
        base_filters = filters.__dict__.copy() if filters else {}
        
        # 有効データ数（削除済み除外）
        active_filters = FilterRequest(**{**base_filters, "include_deleted": False})
        active_filter_where, active_filter_params = DataService.build_filter_conditions(active_filters)
        
        active_count_query = f"""
        SELECT COUNT(*)
        FROM recepthead
        LEFT JOIN m_emp ON recepthead.receptempcd = m_emp.empcd
        LEFT JOIN exechead ON recepthead.receptno = exechead.receptno
        LEFT JOIN m_ctitem AS cond_item ON exechead.condition = cond_item.itemcd
        LEFT JOIN receptbody ON recepthead.receptno = receptbody.receptno
        LEFT JOIN execbody ON recepthead.receptno = execbody.receptno
        LEFT JOIN m_ctitem AS stype_item ON exechead.stype = stype_item.itemcd
        LEFT JOIN m_ctitem AS prod_item ON exechead.producttype = prod_item.itemcd
        WHERE recepthead.extentid IS NOT NULL
        AND extentid != 0
        AND (
            recepthead.calldt >= '2015-01-01 00:00:00'
            OR receptbody.moddt >= '2015-01-01 00:00:00'
        )
        {active_filter_where}
        """
        
        # 全データ数（削除済み含む）
        all_filters = FilterRequest(**{**base_filters, "include_deleted": True})
        all_filter_where, all_filter_params = DataService.build_filter_conditions(all_filters)
        
        all_count_query = f"""
        SELECT COUNT(*)
        FROM recepthead
        LEFT JOIN m_emp ON recepthead.receptempcd = m_emp.empcd
        LEFT JOIN exechead ON recepthead.receptno = exechead.receptno
        LEFT JOIN m_ctitem AS cond_item ON exechead.condition = cond_item.itemcd
        LEFT JOIN receptbody ON recepthead.receptno = receptbody.receptno
        LEFT JOIN execbody ON recepthead.receptno = execbody.receptno
        LEFT JOIN m_ctitem AS stype_item ON exechead.stype = stype_item.itemcd
        LEFT JOIN m_ctitem AS prod_item ON exechead.producttype = prod_item.itemcd
        WHERE recepthead.extentid IS NOT NULL
        AND extentid != 0
        AND (
            recepthead.calldt >= '2015-01-01 00:00:00'
            OR receptbody.moddt >= '2015-01-01 00:00:00'
        )
        {all_filter_where}
        """
        
        active_result = db_manager.execute_query(active_count_query, tuple(active_filter_params))
        all_result = db_manager.execute_query(all_count_query, tuple(all_filter_params))
        
        active_count = active_result[0]['count']
        total_count = all_result[0]['count']
        deleted_count = total_count - active_count
        
        return {
            "total_records": total_count,
            "active_records": active_count,
            "deleted_records": deleted_count
        }