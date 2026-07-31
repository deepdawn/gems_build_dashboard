# 12시간 이내 출루수
SELECT
    DATE(DATE_ADD(D.created_at, INTERVAL 9 HOUR)) AS 'date',
    CEIL((UNIX_TIMESTAMP(D.released_at) - UNIX_TIMESTAMP(D.created_at)) / 3600) AS '출루까지 시간',
    D.deploy_type AS '배치 구분',
    D.model_type AS '기종',
    G.region_name AS '대지역',
    E.region_name AS '중지역',
    COUNT(D.id) AS '출루수'
FROM
    gbike.rich_deploy_zone_usages D
        JOIN
    gbike.rich_release_spot S ON D.deploy_zone_id = S.id
        JOIN
    gbike.rich_region R ON S.region_id = R.region_id
        JOIN
    gbike.rich_region E ON R.parent_id = E.region_id
        JOIN
    gbike.rich_region G ON E.parent_id = G.region_id
WHERE
    D.created_at >= CONVERT_TZ('2026-03-01 00:00:00', 'Asia/Seoul', 'UTC')
    AND D.deleted_at IS NULL
    AND G.region_name IN ('남부RS팀','RS그룹','서울RS팀','중앙RS팀','경상RS팀','강남RS팀','프로젝트_루미')
    AND R.region_name LIKE '%본사직영%'
    AND R.region_name NOT LIKE '미사용%'
    /* 출루까지 시간 24 이하 필터링 */
    AND CEIL((UNIX_TIMESTAMP(D.released_at) - UNIX_TIMESTAMP(D.created_at)) / 3600) <= 12
GROUP BY 1 , 2 , 3 , 4 , 5 , 6
;