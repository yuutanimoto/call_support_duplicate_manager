from typing import List, Optional
from models.response_models import ReceptionDataRecord, DuplicateGroup
from models.request_models import FilterRequest
from services.data_service import DataService
from database import db_manager

class DuplicateService:
    @staticmethod
    def build_duplicate_order_by(sort_by: str = None, sort_order: str = None) -> str:
        """重複検出用のORDER BY句を構築"""
        # カラム名のマッピング（SQLインジェクション対策）
        column_map = {
            "id": "id",
            "content": "content",
            "status": "status",
            "progress": "progress",
            "system_type": "system_type",
            "product": "product",
            "reception_datetime": "reception_datetime",
            "update_datetime": "update_datetime"
        }
        
        if not sort_by:
            return "duplicate_key, id"
        
        # 複数列ソートの解析
        sort_columns = sort_by.split(',') if ',' in sort_by else [sort_by]
        sort_orders = sort_order.split(',') if ',' in sort_order and sort_order else ["ASC"]
        
        order_by_parts = []
        for i, column in enumerate(sort_columns):
            column = column.strip()
            if column in column_map:
                direction = sort_orders[i].strip().upper() if i < len(sort_orders) else "ASC"
                if direction not in ("ASC", "DESC"):
                    direction = "ASC"
                order_by_parts.append(f"{column_map[column]} {direction}")
        
        # duplicate_keyを最優先にする
        if order_by_parts:
            return f"duplicate_key, {', '.join(order_by_parts)}"
        else:
            return "duplicate_key, id"
    
    @staticmethod
    def detect_duplicates(
        duplicate_type: str,
        filters: Optional[FilterRequest] = None,
        sort_by: str = None,
        sort_order: str = None
    ) -> List[DuplicateGroup]:
        """重複データ検出"""

        # フィルター条件構築
        filter_where, filter_params = "", []
        if filters:
            filter_where, filter_params = DataService.build_filter_conditions(filters)

        if duplicate_type == "exact":
            partition_by = "receptbody.rdata, COALESCE(execbody.execstate, '')"
            duplicate_key = "CONCAT(COALESCE(receptbody.rdata, ''), '|', COALESCE(execbody.execstate, ''))"
            additional_where = "AND recepthead.receptmoddt IS NULL"
        elif duplicate_type == "content":
            partition_by = "receptbody.rdata"
            duplicate_key = "COALESCE(receptbody.rdata, '')"
            additional_where = "AND receptbody.rdata IS NOT NULL AND receptbody.rdata != '' AND recepthead.receptmoddt IS NULL"
        elif duplicate_type == "status":
            partition_by = "COALESCE(execbody.execstate, '')"
            duplicate_key = "COALESCE(execbody.execstate, '')"
            additional_where = "AND COALESCE(execbody.execstate, '') != '' AND recepthead.receptmoddt IS NULL"
        else:
            raise ValueError(f"Invalid duplicate_type: {duplicate_type}")

        query = f"""
        WITH duplicates AS (
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
                COALESCE(receptbody.moddt, recepthead.calldt) AT TIME ZONE 'Asia/Tokyo' AS update_datetime,
                ROW_NUMBER() OVER (
                    PARTITION BY {partition_by}
                    ORDER BY recepthead.extentid
                ) as row_num,
                COUNT(*) OVER (
                    PARTITION BY {partition_by}
                ) as duplicate_count,
                {duplicate_key} as duplicate_key
            FROM recepthead
            LEFT JOIN m_emp ON recepthead.receptempcd = m_emp.empcd
            LEFT JOIN exechead ON recepthead.receptno = exechead.receptno
            LEFT JOIN m_ctitem AS cond_item ON exechead.condition = cond_item.itemcd
            LEFT JOIN receptbody ON recepthead.receptno = receptbody.receptno
            LEFT JOIN execbody ON recepthead.receptno = execbody.receptno
            LEFT JOIN m_ctitem AS stype_item ON exechead.stype = stype_item.itemcd
            LEFT JOIN m_ctitem AS prod_item ON exechead.producttype = prod_item.itemcd
            WHERE recepthead.extentid IS NOT NULL
            AND recepthead.extentid != 0
            AND (
                recepthead.calldt >= '2015-01-01 00:00:00'
                OR receptbody.moddt >= '2015-01-01 00:00:00'
            )
            {additional_where}
            {filter_where}
        )
        SELECT
            id,
            content,
            status,
            result,
            report,
            progress,
            system_type,
            product,
            reception_moddt,
            reception_datetime,
            update_datetime,
            duplicate_count,
            duplicate_key
        FROM duplicates
        WHERE duplicate_count > 1
        ORDER BY {DuplicateService.build_duplicate_order_by(sort_by, sort_order)}
        """

        result = db_manager.execute_query(query, tuple(filter_params))

        # グループ化
        groups = {}
        for row in result:
            key = row['duplicate_key']
            if key not in groups:
                groups[key] = {
                    'group_id': f"group_{len(groups)}",
                    'duplicate_key': key,
                    'duplicate_count': row['duplicate_count'],
                    'records': []
                }
            
            # レコード作成（duplicate_count除外）
            record_data = {k: v for k, v in row.items() if k not in ['duplicate_count']}
            record_data['duplicate_type'] = duplicate_type
            
            groups[key]['records'].append(ReceptionDataRecord(**record_data))

        return [DuplicateGroup(**group) for group in groups.values()]