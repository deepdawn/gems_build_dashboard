# 72시간 미사용
SELECT
    date,
    high_region_name,
    middle_region_name,
    region_id,
    CASE
            WHEN type IN (15,17,18,22,24) THEN '자전거'
            WHEN type IN (9,10,11,12,13,16,19,23) THEN '킥보드'
            ELSE 'none'
        END AS "기기구분",
    -- SUM(deactivate_24h_count)/count(distinct hour) AS deactivate_24h_count,
    -- SUM(deactivate_48h_count)/24 AS deactivate_48h_count,
    SUM(deactivate_72h_count)/count(distinct hour) AS deactivate_72h_count,
    SUM(total_vehicle_count)/count(distinct hour) AS total_vehicle_count
FROM gbike_smartops.vehicle_statistics_data
WHERE date >= '2026-03-01'
and (middle_region_name LIKE '%캠프%' OR middle_region_name LIKE '%루미%')
and region_name like '%본사직영%'
AND region_name NOT LIKE '%미사용%'
GROUP BY 1,2,3,4,5