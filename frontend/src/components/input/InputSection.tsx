import React, { useEffect, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { useDuckDB } from '../../hooks/useDuckDB';
import { CardA_TaskPerAsset } from './CardA_TaskPerAsset';
import { CardB_ReallocPerAsset } from './CardB_ReallocPerAsset';
import { CardC_BatteryPerAsset } from './CardC_BatteryPerAsset';
import { CardA_Unused } from './CardA_Unused';
import { CardB_Deployment } from './CardB_Deployment';
import { CardC_Allocation } from './CardC_Allocation';
import { CardE_Points } from './CardE_Points';

export const InputSection: React.FC = () => {
  const { center, camp, dateType, selectedDate, device, queryTrigger, partitionsError } = useFilters();
  const { isReady, query } = useDuckDB();
  
  const [debugError, setDebugError] = useState<string | null>(null);

  // New Cards Data
  const [taskChart, setTaskChart] = useState<{name:string, value:number}[]>([]);
  const [taskValue, setTaskValue] = useState(0);
  const [taskCenter, setTaskCenter] = useState(0);
  const [taskCompany, setTaskCompany] = useState(0);

  const [reallocChart, setReallocChart] = useState<{name:string, value:number}[]>([]);
  const [reallocValue, setReallocValue] = useState(0);
  const [reallocCenter, setReallocCenter] = useState(0);
  const [reallocCompany, setReallocCompany] = useState(0);

  const [batteryChart, setBatteryChart] = useState<{name:string, value:number}[]>([]);
  const [batteryValue, setBatteryValue] = useState(0);
  const [batteryCenter, setBatteryCenter] = useState(0);
  const [batteryCompany, setBatteryCompany] = useState(0);

  // Existing Cards Data
  const [unusedData, setUnusedData] = useState<{name: string; value: number}[]>([]);
  const [unusedRate, setUnusedRate] = useState(0);

  const [deploymentCount, setDeploymentCount] = useState(0);
  const [deploymentCountMoM, setDeploymentCountMoM] = useState(0);
  const [dispatchRate24h, setDispatchRate24h] = useState(0);
  const [dispatchRate24hMoM, setDispatchRate24hMoM] = useState(0);
  const [dispatchRate24hCompanyDiff, setDispatchRate24hCompanyDiff] = useState(0);

  const [currentAllocation, setCurrentAllocation] = useState(0);
  const [prevAllocation, setPrevAllocation] = useState(0);

  const [managementZoneCount, setManagementZoneCount] = useState(0);
  const [activeZoneRate, setActiveZoneRate] = useState(0);
  const [activeZoneRateMoM, setActiveZoneRateMoM] = useState(0);
  const [activeZoneRateCompanyDiff, setActiveZoneRateCompanyDiff] = useState(0);
  const [prevActiveZoneRate, setPrevActiveZoneRate] = useState(0);
  const [companyActiveZoneRate, setCompanyActiveZoneRate] = useState(0);

  useEffect(() => {
    let ignore = false;
    if (!isReady || !camp || !selectedDate) return;

    const fetchData = async () => {
      try {
        setDebugError(null);
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
            const d = new Date(year, 0, 1 + (week - 1) * 7);
            month = d.getMonth() + 1;
          }
        }

        let dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = ${month}`;
        let prevDateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${month === 1 ? year - 1 : year} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = ${month === 1 ? 12 : month - 1}`;
        if (isWeekly) {
          dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(WEEK FROM CAST(date AS DATE)) = ${week}`;
          prevDateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${week === 1 ? year - 1 : year} AND EXTRACT(WEEK FROM CAST(date AS DATE)) = ${week === 1 ? 52 : week - 1}`;
        }

        const getDeviceCond = (col: string) => {
          if (device === '자전거') return `AND ${col} IN ('자전거', 'bicycle')`;
          if (device === '킥보드') return `AND ${col} IN ('킥보드', 'scooter')`;
          return '';
        };
        const devDaily = getDeviceCond('기기구분');
        const devTask = getDeviceCond('기기타입');
        const devUnused = getDeviceCond('기기구분');
        const devZone = getDeviceCond('기종');

        // Chart Range Logic (Past 4 weeks)
        const maxDateQuery = `SELECT strftime(MAX(date), '%Y-%m-%d') as max_d FROM daily_stats WHERE middle_region_name = '${camp}' AND ${dateCondition} ${devDaily}`;
        const maxDateRes = await query(maxDateQuery);
        let chartMaxDate = `${year}-${month.toString().padStart(2, '0')}-28`;
        if (maxDateRes.length > 0 && maxDateRes[0].max_d) {
          chartMaxDate = maxDateRes[0].max_d;
        }
        
        const chart4WeekCondition = `
          CAST(date AS DATE) >= (date_trunc('week', CAST('${chartMaxDate}' AS DATE)) - INTERVAL 21 DAY)
          AND CAST(date AS DATE) < (date_trunc('week', CAST('${chartMaxDate}' AS DATE)) + INTERVAL 7 DAY)
        `;

        // 1. Task, Realloc, Battery (Top Row - Charts: 4 Weeks, Avg: Current Period)
        // Avg: Current Period
        const currentPeriodJoinedQuery = `
          WITH d_alloc AS (
            SELECT date, middle_region_name as camp, high_region_name as center, SUM(할당대수) as alloc
            FROM daily_stats
            WHERE ${dateCondition} ${devDaily}
            GROUP BY date, camp, center
          ),
          d_task AS (
            SELECT date, 중분류 as camp, 대분류 as center, 
                   SUM(재배치_건수) as realloc, SUM(배터리_건수) as battery, SUM(재배치_건수 + 배터리_건수) as task
            FROM task_stats
            WHERE ${dateCondition} ${devTask}
            GROUP BY date, camp, center
          )
          SELECT 
            d_alloc.date, d_alloc.camp, d_alloc.center, 
            d_alloc.alloc, 
            COALESCE(d_task.realloc, 0) as realloc, 
            COALESCE(d_task.battery, 0) as battery, 
            COALESCE(d_task.task, 0) as task
          FROM d_alloc
          LEFT JOIN d_task ON d_alloc.date = d_task.date AND d_alloc.camp = d_task.camp
        `;
        const currentRes = await query(currentPeriodJoinedQuery);
        if (ignore) return;

        const computeAvg = (data: any[]) => {
          let totalAlloc = 0, totalRealloc = 0, totalBattery = 0, totalTask = 0;
          let daysCount = new Set();
          for (const row of data) {
            daysCount.add(row.date);
            totalAlloc += Number(row.alloc) || 0;
            totalRealloc += Number(row.realloc) || 0;
            totalBattery += Number(row.battery) || 0;
            totalTask += Number(row.task) || 0;
          }
          const avgAlloc = daysCount.size > 0 ? totalAlloc / daysCount.size : 0;
          return {
            taskAvg: avgAlloc > 0 ? totalTask / avgAlloc : 0,
            reallocAvg: avgAlloc > 0 ? totalRealloc / avgAlloc : 0,
            batteryAvg: avgAlloc > 0 ? totalBattery / avgAlloc : 0,
          };
        };

        const currentCampRes = computeAvg(currentRes.filter((r: any) => r.camp === camp));
        const currentCenterRes = computeAvg(currentRes.filter((r: any) => r.center && r.center.includes(center)));
        const currentCompanyRes = computeAvg(currentRes);

        setTaskValue(currentCampRes.taskAvg);
        setTaskCenter(currentCenterRes.taskAvg);
        setTaskCompany(currentCompanyRes.taskAvg);
        setReallocValue(currentCampRes.reallocAvg);
        setReallocCenter(currentCenterRes.reallocAvg);
        setReallocCompany(currentCompanyRes.reallocAvg);
        setBatteryValue(currentCampRes.batteryAvg);
        setBatteryCenter(currentCenterRes.batteryAvg);
        setBatteryCompany(currentCompanyRes.batteryAvg);

        // Chart Data (4 Weeks)
        const chartJoinedQuery = `
          WITH d_alloc AS (
            SELECT 
              'W' || EXTRACT(WEEK FROM CAST(date AS DATE)) as week_label,
              date_trunc('week', CAST(date AS DATE)) as week_start,
              middle_region_name as camp,
              SUM(할당대수) / NULLIF(COUNT(DISTINCT date), 0) as avg_daily_alloc
            FROM daily_stats
            WHERE middle_region_name = '${camp}' AND ${chart4WeekCondition} ${devDaily}
            GROUP BY week_label, week_start, camp
          ),
          d_task AS (
            SELECT 
              'W' || EXTRACT(WEEK FROM CAST(date AS DATE)) as week_label,
              중분류 as camp,
              SUM(재배치_건수) as realloc, SUM(배터리_건수) as battery, SUM(재배치_건수 + 배터리_건수) as task
            FROM task_stats
            WHERE 중분류 = '${camp}' AND ${chart4WeekCondition} ${devTask}
            GROUP BY week_label, camp
          )
          SELECT 
            d_alloc.week_label as day, d_alloc.week_start,
            d_alloc.avg_daily_alloc as alloc, 
            COALESCE(d_task.realloc, 0) as realloc, 
            COALESCE(d_task.battery, 0) as battery, 
            COALESCE(d_task.task, 0) as task
          FROM d_alloc
          LEFT JOIN d_task ON d_alloc.week_label = d_task.week_label AND d_alloc.camp = d_task.camp
          ORDER BY week_start
        `;
        const chartRes = await query(chartJoinedQuery);
        if (ignore) return;
        
        setTaskChart(chartRes.map((c: any) => ({ name: c.day, value: c.alloc > 0 ? c.task / c.alloc : 0 })));
        setReallocChart(chartRes.map((c: any) => ({ name: c.day, value: c.alloc > 0 ? c.realloc / c.alloc : 0 })));
        setBatteryChart(chartRes.map((c: any) => ({ name: c.day, value: c.alloc > 0 ? c.battery / c.alloc : 0 })));

        // 2. Unused
        const unusedCurrentQuery = `
          SELECT SUM(deactivate_72h_count) as unused, SUM(total_vehicle_count) as total
          FROM unused_72h 
          WHERE middle_region_name = '${camp}' AND ${dateCondition} ${devUnused}
        `;
        const unusedCurrentRes = await query(unusedCurrentQuery);
        if (unusedCurrentRes.length > 0) {
          const tUnused = Number(unusedCurrentRes[0].unused) || 0;
          const tTotal = Number(unusedCurrentRes[0].total) || 0;
          setUnusedRate(tTotal > 0 ? (tUnused / tTotal) * 100 : 0);
        } else {
          setUnusedRate(0);
        }

        const unusedChartQuery = `
          SELECT 'W' || EXTRACT(WEEK FROM CAST(date AS DATE)) as day, 
                 date_trunc('week', CAST(date AS DATE)) as week_start,
                 SUM(deactivate_72h_count) as unused, SUM(total_vehicle_count) as total
          FROM unused_72h 
          WHERE middle_region_name = '${camp}' AND ${chart4WeekCondition} ${devUnused}
          GROUP BY day, week_start
          ORDER BY week_start
        `;
        const unusedChartRes = await query(unusedChartQuery);
        setUnusedData(unusedChartRes.map((r: any) => ({ name: r.day, value: r.total > 0 ? (r.unused / r.total) * 100 : 0 })));

        // 3. Allocation (Card C)
        const allocQuery = `SELECT AVG(daily_alloc) as avg_alloc FROM (SELECT date, SUM(할당대수) as daily_alloc FROM daily_stats WHERE middle_region_name = '${camp}' AND ${dateCondition} ${devDaily} GROUP BY date)`;
        const prevAllocQuery = `SELECT AVG(daily_alloc) as avg_alloc FROM (SELECT date, SUM(할당대수) as daily_alloc FROM daily_stats WHERE middle_region_name = '${camp}' AND ${prevDateCondition} ${devDaily} GROUP BY date)`;
        const allocR = await query(allocQuery);
        const pAllocR = await query(prevAllocQuery);
        setCurrentAllocation(allocR.length > 0 ? Number(allocR[0].avg_alloc) || 0 : 0);
        setPrevAllocation(pAllocR.length > 0 ? Number(pAllocR[0].avg_alloc) || 0 : 0);

        // 4. Points & Deployment
        const deploySpotQuery = `SELECT COUNT(DISTINCT deploy_zone_id) as total_zones FROM deploy_spot WHERE mid_region_name = '${camp}'`;
        const spotRes = await query(deploySpotQuery);
        const totalZones = spotRes.length > 0 ? Number(spotRes[0].total_zones) || 0 : 0;
        setManagementZoneCount(totalZones);

        const activeZoneQuery = `SELECT COUNT(DISTINCT 배치존명) as active_zones FROM deploy_zone_usages WHERE 중지역 = '${camp}' AND ${dateCondition} ${devZone}`;
        const aZoneRes = await query(activeZoneQuery);
        const activeZones = aZoneRes.length > 0 ? Number(aZoneRes[0].active_zones) || 0 : 0;
        const curZoneRate = totalZones > 0 ? (activeZones / totalZones) * 100 : 0;
        setActiveZoneRate(curZoneRate);

        const pActiveZoneQuery = `SELECT COUNT(DISTINCT 배치존명) as active_zones FROM deploy_zone_usages WHERE 중지역 = '${camp}' AND ${prevDateCondition} ${devZone}`;
        const paZoneRes = await query(pActiveZoneQuery);
        const pActiveZones = paZoneRes.length > 0 ? Number(paZoneRes[0].active_zones) || 0 : 0;
        const pZoneRate = totalZones > 0 ? (pActiveZones / totalZones) * 100 : 0;
        setPrevActiveZoneRate(pZoneRate);
        setActiveZoneRateMoM(curZoneRate - pZoneRate);

        const deployCountQuery = `SELECT SUM(배치수) as total_deploy FROM deploy_zone_usages WHERE 중지역 = '${camp}' AND ${dateCondition} ${devZone}`;
        const dCountRes = await query(deployCountQuery);
        const cDeploy = dCountRes.length > 0 ? Number(dCountRes[0].total_deploy) || 0 : 0;
        setDeploymentCount(cDeploy);

        const pDeployCountQuery = `SELECT SUM(배치수) as total_deploy FROM deploy_zone_usages WHERE 중지역 = '${camp}' AND ${prevDateCondition} ${devZone}`;
        const pdCountRes = await query(pDeployCountQuery);
        const pDeploy = pdCountRes.length > 0 ? Number(pdCountRes[0].total_deploy) || 0 : 0;
        setDeploymentCountMoM(pDeploy > 0 ? ((cDeploy - pDeploy) / pDeploy) * 100 : 0);

        const dispatchQuery = `SELECT SUM(CASE WHEN "출루까지 시간" <= 24 THEN 배치수 ELSE 0 END) as d24, SUM(배치수) as tot FROM deploy_used_time WHERE 중지역 = '${camp}' AND ${dateCondition} ${devZone}`;
        const dispRes = await query(dispatchQuery);
        const cDisp = dispRes.length > 0 ? (Number(dispRes[0].tot) > 0 ? (Number(dispRes[0].d24)/Number(dispRes[0].tot))*100 : 0) : 0;
        setDispatchRate24h(cDisp);

        const pDispatchQuery = `SELECT SUM(CASE WHEN "출루까지 시간" <= 24 THEN 배치수 ELSE 0 END) as d24, SUM(배치수) as tot FROM deploy_used_time WHERE 중지역 = '${camp}' AND ${prevDateCondition} ${devZone}`;
        const pDispRes = await query(pDispatchQuery);
        const pDisp = pDispRes.length > 0 ? (Number(pDispRes[0].tot) > 0 ? (Number(pDispRes[0].d24)/Number(pDispRes[0].tot))*100 : 0) : 0;
        setDispatchRate24hMoM(cDisp - pDisp);

        const cSpotQuery = `SELECT COUNT(DISTINCT deploy_zone_id) as total_zones FROM deploy_spot`;
        const cSpotRes = await query(cSpotQuery);
        const cTotalZones = cSpotRes.length > 0 ? Number(cSpotRes[0].total_zones) || 0 : 0;
        const caZoneQuery = `SELECT COUNT(DISTINCT 배치존명) as active_zones FROM deploy_zone_usages WHERE ${dateCondition} ${devZone}`;
        const caZoneRes = await query(caZoneQuery);
        const caZones = caZoneRes.length > 0 ? Number(caZoneRes[0].active_zones) || 0 : 0;
        const cZoneRate = cTotalZones > 0 ? (caZones / cTotalZones) * 100 : 0;
        setCompanyActiveZoneRate(cZoneRate);
        setActiveZoneRateCompanyDiff(curZoneRate - cZoneRate);

        const cDispQuery = `SELECT SUM(CASE WHEN "출루까지 시간" <= 24 THEN 배치수 ELSE 0 END) as d24, SUM(배치수) as tot FROM deploy_used_time WHERE ${dateCondition} ${devZone}`;
        const cDispRes = await query(cDispQuery);
        const cDispR = cDispRes.length > 0 ? (Number(cDispRes[0].tot) > 0 ? (Number(cDispRes[0].d24)/Number(cDispRes[0].tot))*100 : 0) : 0;
        setDispatchRate24hCompanyDiff(cDisp - cDispR);

      } catch (err: any) {
        console.error("Failed to fetch input section data:", err);
        setDebugError(err.toString());
      }
    };

    if (queryTrigger > 0) {
      fetchData();
    }
    
    return () => {
      ignore = true;
    };
  }, [isReady, queryTrigger, center, camp, dateType, selectedDate, device]);

  return (
    <div>
      <h2 className="font-bold text-slate-800 text-lg mb-3 text-left">2. INPUT</h2>
      {partitionsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Init Error:</strong> {partitionsError}
        </div>
      )}
      {debugError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {debugError}
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <CardA_TaskPerAsset data={taskChart} currentValue={taskValue} centerAvg={taskCenter} companyAvg={taskCompany} />
        <CardB_ReallocPerAsset data={reallocChart} currentValue={reallocValue} centerAvg={reallocCenter} companyAvg={reallocCompany} />
        <CardC_BatteryPerAsset data={batteryChart} currentValue={batteryValue} centerAvg={batteryCenter} companyAvg={batteryCompany} />
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
          prevActiveZoneRate={prevActiveZoneRate}
          companyActiveZoneRate={companyActiveZoneRate}
          comparisonLabel={dateType === '주 단위' ? '전주' : '전월'}
        />
      </div>
    </div>
  );
};
