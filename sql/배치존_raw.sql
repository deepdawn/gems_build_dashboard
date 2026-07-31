with batch as (
    select rrr.region_name as high_region_name,rr.region_name as mid_region_name,r.region_name as low_region_name,
           rs.name as '배치존명',rs.location,rs.is_show,rs.bicycle_count,rs.created_at,rs.updated_at,rs.deleted_at,
           rs.id as deploy_zone_id,rs.bicycle_count as "설정대수",
           rr.region_id as middle_region_id
    from gbike.rich_release_spot rs
    join gbike.rich_region r on rs.region_id = r.region_id
    join gbike.rich_region rr on rr.region_id = r.parent_id
    join gbike.rich_region rrr on rrr.region_id = rr.parent_id
    where 1=1
)
select *
from batch b
where 1=1