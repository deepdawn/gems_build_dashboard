import React, { useEffect, useState } from 'react';
import { CardA_Unused } from './CardA_Unused';
import { CardB_Deployment } from './CardB_Deployment';
import { CardC_Allocation } from './CardC_Allocation';
import { CardD_Reallocation } from './CardD_Reallocation';
import { CardE_Points } from './CardE_Points';
import { CardF_Workload } from './CardF_Workload';
import { useFilters } from '../../context/FilterContext';
import { useDuckDB } from '../../hooks/useDuckDB';
import { registerPartitions } from '../../lib/duckdb';

export const InputSection: React.FC = () => {
  const { camp, dateType, selectedDate } = useFilters();
  const { isReady, query } = useDuckDB();
  
  const [unusedData, setUnusedData] = useState<{name: string; value: number}[]>([]);
  const [unusedRate, setUnusedRate] = useState(0);
  const [reallocationCount, setReallocationCount] = useState(0);
  const [batteryCount, setBatteryCount] = useState(0);
  const [currentAllocation, setCurrentAllocation] = useState(0);
  const [prevAllocation, setPrevAllocation] = useState(0);

  const [managementZoneCount, setManagementZoneCount] = useState(0);
  const [activeZoneRate, setActiveZoneRate] = useState(0);
  const [activeZoneRateMoM, setActiveZoneRateMoM] = useState(0);
  const [activeZoneRateCompanyDiff, setActiveZoneRateCompanyDiff] = useState(0);

  const [deploymentCount, setDeploymentCount] = useState(0);
  const [deploymentCountMoM, setDeploymentCountMoM] = useState(0);
  const [dispatchRate24h, setDispatchRate24h] = useState(0);
  const [dispatchRate24hMoM, setDispatchRate24hMoM] = useState(0);
  const [dispatchRate24hCompanyDiff, setDispatchRate24hCompanyDiff] = useState(0);

  useEffect(() => {
    if (!isReady || !camp || !selectedDate) return;

    const fetchData = async () => {
      try {
        let year = 2026;
        let month = 1;
        let week = 1;
        let isWeekly = dateType === '주 단위';
        
        if (!isWeekly) {
          const match = selectedDate.match(/(\d+)년\s+(\d+)월/);
          if (match) {
            year = 2000 + parseInt(match[1]);
            month = parseInt(match[2]);
          }
        } else {
          const match = selectedDate.match(/(\d+)-W(\d+)/);
          if (match) {
            year = 2000 + parseInt(match[1]);
            week = parseInt(match[2]);
          }
        }

        let dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = ${month}`;
        if (isWeekly) {
          dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(WEEK FROM CAST(date AS DATE)) = ${week}`;
        }

        // 파티션 로드 (현재 월 & 전월)
        await registerPartitions(year, month);

        // 1. 72시간 미사용 데이터 (Card A)
        const unusedQuery = `
          SELECT strftime(date, '%m-%d') as day, SUM(deactivate_72h_count) as unused, SUM(total_vehicle_count) as total
          FROM unused_72h 
          WHERE middle_region_name = '${camp}' AND ${dateCondition}
          GROUP BY day
          ORDER BY day
        `;
        const unusedRes = await query(unusedQuery);
        if (unusedRes.length > 0) {
          const chartData = unusedRes.map((r: any) => ({
            name: r.day,
            value: r.total > 0 ? (r.unused / r.total) * 100 : 0
          }));
          setUnusedData(chartData);
          
          // 평균 미사용률
          const totalUnused = unusedRes.reduce((acc: number, r: any) => acc + (r.unused || 0), 0);
          const totalVehicles = unusedRes.reduce((acc: number, r: any) => acc + (r.total || 0), 0);
          setUnusedRate(totalVehicles > 0 ? (totalUnused / totalVehicles) * 100 : 0);
        } else {
          setUnusedData([]);
          setUnusedRate(0);
        }

        // 2. 작업내역 데이터 (Card D, F)
        const taskQuery = `
          SELECT SUM(재배치_건수) as realloc, SUM(배터리_건수) as battery
          FROM task_stats
          WHERE 중분류 = '${camp}' AND ${dateCondition}
        `;
        const taskRes = await query(taskQuery);
        if (taskRes.length > 0) {
          setReallocationCount(Number(taskRes[0].realloc) || 0);
          setBatteryCount(Number(taskRes[0].battery) || 0);
        }

        // 3. 할당대수 데이터 (Card C)
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYearForMonth = month === 1 ? year - 1 : year;
        const prevWeek = week === 1 ? 52 : week - 1;
        const prevYearForWeek = week === 1 ? year - 1 : year;

        let prevDateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${prevYearForMonth} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = ${prevMonth}`;
        if (isWeekly) {
          prevDateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${prevYearForWeek} AND EXTRACT(WEEK FROM CAST(date AS DATE)) = ${prevWeek}`;
        }

        const allocQuery = `SELECT AVG(할당대수) as avg_alloc FROM daily_stats WHERE middle_region_name = '${camp}' AND ${dateCondition}`;
        const allocRes = await query(allocQuery);
        setCurrentAllocation(allocRes.length > 0 ? Number(allocRes[0].avg_alloc) || 0 : 0);

        const prevAllocQuery = `SELECT AVG(할당대수) as avg_alloc FROM daily_stats WHERE middle_region_name = '${camp}' AND ${prevDateCondition}`;
        const prevAllocRes = await query(prevAllocQuery);
        setPrevAllocation(prevAllocRes.length > 0 ? Number(prevAllocRes[0].avg_alloc) || 0 : 0);

        // 4. Card E & Card B 데이터 (deploy_spot, deploy_zone_usages, deploy_used_time)
        // Card E: 관리 배치존 수
        const deploySpotQuery = `SELECT COUNT(DISTINCT deploy_zone_id) as total_zones FROM deploy_spot WHERE mid_region_name = '${camp}'`;
        const spotRes = await query(deploySpotQuery);
        const totalZones = spotRes.length > 0 ? Number(spotRes[0].total_zones) || 0 : 0;
        setManagementZoneCount(totalZones);

        // Card E: 배치존 중 배치 수
        const activeZoneQuery = `SELECT COUNT(DISTINCT 배치존명) as active_zones FROM deploy_zone_usages WHERE 중지역 = '${camp}' AND ${dateCondition}`;
        const activeZoneRes = await query(activeZoneQuery);
        const activeZones = activeZoneRes.length > 0 ? Number(activeZoneRes[0].active_zones) || 0 : 0;
        const currentActiveZoneRate = totalZones > 0 ? (activeZones / totalZones) * 100 : 0;
        setActiveZoneRate(currentActiveZoneRate);

        const prevActiveZoneQuery = `SELECT COUNT(DISTINCT 배치존명) as active_zones FROM deploy_zone_usages WHERE 중지역 = '${camp}' AND ${prevDateCondition}`;
        const prevActiveZoneRes = await query(prevActiveZoneQuery);
        const prevActiveZones = prevActiveZoneRes.length > 0 ? Number(prevActiveZoneRes[0].active_zones) || 0 : 0;
        const prevActiveZoneRate = totalZones > 0 ? (prevActiveZones / totalZones) * 100 : 0;
        setActiveZoneRateMoM(currentActiveZoneRate - prevActiveZoneRate);

        // Card B: 배치존 배치수
        const deployCountQuery = `SELECT SUM(배치수) as total_deploy FROM deploy_zone_usages WHERE 중지역 = '${camp}' AND ${dateCondition}`;
        const deployCountRes = await query(deployCountQuery);
        const currentDeployCount = deployCountRes.length > 0 ? Number(deployCountRes[0].total_deploy) || 0 : 0;
        setDeploymentCount(currentDeployCount);

        const prevDeployCountQuery = `SELECT SUM(배치수) as total_deploy FROM deploy_zone_usages WHERE 중지역 = '${camp}' AND ${prevDateCondition}`;
        const prevDeployCountRes = await query(prevDeployCountQuery);
        const prevDeployCount = prevDeployCountRes.length > 0 ? Number(prevDeployCountRes[0].total_deploy) || 0 : 0;
        setDeploymentCountMoM(prevDeployCount > 0 ? ((currentDeployCount - prevDeployCount) / prevDeployCount) * 100 : 0);

        // Card B: 24시간 내 출루율
        const dispatchQuery = `
          SELECT SUM(CASE WHEN "출루까지 시간" <= 24 THEN 배치수 ELSE 0 END) as dispatch_24, 
                 SUM(배치수) as total_dispatch 
          FROM deploy_used_time 
          WHERE 중지역 = '${camp}' AND ${dateCondition}
        `;
        const dispatchRes = await query(dispatchQuery);
        const dispatch24 = dispatchRes.length > 0 ? Number(dispatchRes[0].dispatch_24) || 0 : 0;
        const totalDispatch = dispatchRes.length > 0 ? Number(dispatchRes[0].total_dispatch) || 0 : 0;
        const currentDispatchRate = totalDispatch > 0 ? (dispatch24 / totalDispatch) * 100 : 0;
        setDispatchRate24h(currentDispatchRate);

        const prevDispatchQuery = `
          SELECT SUM(CASE WHEN "출루까지 시간" <= 24 THEN 배치수 ELSE 0 END) as dispatch_24, 
                 SUM(배치수) as total_dispatch 
          FROM deploy_used_time 
          WHERE 중지역 = '${camp}' AND ${prevDateCondition}
        `;
        const prevDispatchRes = await query(prevDispatchQuery);
        const prevDispatch24 = prevDispatchRes.length > 0 ? Number(prevDispatchRes[0].dispatch_24) || 0 : 0;
        const prevTotalDispatch = prevDispatchRes.length > 0 ? Number(prevDispatchRes[0].total_dispatch) || 0 : 0;
        const prevDispatchRate = prevTotalDispatch > 0 ? (prevDispatch24 / prevTotalDispatch) * 100 : 0;
        setDispatchRate24hMoM(currentDispatchRate - prevDispatchRate);

        // 5. 전사 기준 비교 데이터 (Card E, B)
        // 전사 배치존 중 배치 수
        const companyDeploySpotQuery = `SELECT COUNT(DISTINCT deploy_zone_id) as total_zones FROM deploy_spot`;
        const companySpotRes = await query(companyDeploySpotQuery);
        const companyTotalZones = companySpotRes.length > 0 ? Number(companySpotRes[0].total_zones) || 0 : 0;

        const companyActiveZoneQuery = `SELECT COUNT(DISTINCT 배치존명) as active_zones FROM deploy_zone_usages WHERE ${dateCondition}`;
        const companyActiveZoneRes = await query(companyActiveZoneQuery);
        const companyActiveZones = companyActiveZoneRes.length > 0 ? Number(companyActiveZoneRes[0].active_zones) || 0 : 0;
        const companyActiveZoneRate = companyTotalZones > 0 ? (companyActiveZones / companyTotalZones) * 100 : 0;
        setActiveZoneRateCompanyDiff(currentActiveZoneRate - companyActiveZoneRate);

        // 전사 24시간 내 출루율
        const companyDispatchQuery = `
          SELECT SUM(CASE WHEN "출루까지 시간" <= 24 THEN 배치수 ELSE 0 END) as dispatch_24, 
                 SUM(배치수) as total_dispatch 
          FROM deploy_used_time 
          WHERE ${dateCondition}
        `;
        const companyDispatchRes = await query(companyDispatchQuery);
        const companyDispatch24 = companyDispatchRes.length > 0 ? Number(companyDispatchRes[0].dispatch_24) || 0 : 0;
        const companyTotalDispatch = companyDispatchRes.length > 0 ? Number(companyDispatchRes[0].total_dispatch) || 0 : 0;
        const companyDispatchRate = companyTotalDispatch > 0 ? (companyDispatch24 / companyTotalDispatch) * 100 : 0;
        setDispatchRate24hCompanyDiff(currentDispatchRate - companyDispatchRate);

      } catch (err) {
        console.error("Failed to fetch input section data:", err);
      }
    };

    fetchData();
  }, [isReady, camp, dateType, selectedDate]);

  return (
    <div>
      <h2 className="font-bold text-slate-800 text-lg mb-3 text-left">2. INPUT</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <CardD_Reallocation count={reallocationCount} />
        <CardF_Workload count={batteryCount} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <CardA_Unused data={unusedData} currentRate={unusedRate} />
        <CardB_Deployment 
          deploymentCount={deploymentCount}
          deploymentCountMoM={deploymentCountMoM}
          dispatchRate24h={dispatchRate24h}
          dispatchRate24hMoM={dispatchRate24hMoM}
          dispatchRate24hCompanyDiff={dispatchRate24hCompanyDiff}
          comparisonLabel={dateType === '주 단위' ? '전주' : '전월'}
        />
        <CardC_Allocation 
          currentAllocation={currentAllocation} 
          prevAllocation={prevAllocation} 
          comparisonLabel={dateType === '주 단위' ? '전주' : '전월'} 
          currentLabel={dateType === '주 단위' ? '현재 주' : '현재 월'}
        />
        <CardE_Points 
          managementZoneCount={managementZoneCount}
          activeZoneRate={activeZoneRate}
          activeZoneRateMoM={activeZoneRateMoM}
          activeZoneRateCompanyDiff={activeZoneRateCompanyDiff}
          comparisonLabel={dateType === '주 단위' ? '전주' : '전월'}
        />
      </div>
    </div>
  );
};
