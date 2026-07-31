# 아웃풋 지표 데이터
SELECT
        date,
        high_region_name,
        middle_region_name,
       region_id,
        CASE
            WHEN model IN ('OMNI BICYCLE', 'GCOO-B3', 'GCOO-B2', 'GCOO-B4', 'A200P') THEN '자전거'
            WHEN model IN ('ES4', 'Max', 'Max Pro', 'GCOO-K1', 'Max Plus', 'GCOO-K2', 'Max Plus X', 'GCOO-K3') THEN '킥보드'
            ELSE 'none'
        END AS "기기구분",
        SUM(assigned_count) AS "할당대수",
        SUM(deployed_count) AS "운행대수",
        SUM(order_count) AS "운행수",
        SUM((calculated_pay_amount + calculated_out_of_area_charge) / 1.1) AS "revenue"
    FROM gbike.rich_daily_statistics
    WHERE date >= '2025-01-01'
    AND (middle_region_name LIKE '%캠프%' or middle_region_name like '%루미%')
    and low_region_name like '%본사직영%'
    AND low_region_name NOT LIKE '%미사용%'
    GROUP BY 1, 2, 3, 4,5
    ORDER BY 1, 2, 3, 4,5;