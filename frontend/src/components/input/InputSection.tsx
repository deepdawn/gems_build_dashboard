import React, { useEffect, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { useDuckDB } from '../../hooks/useDuckDB';
import { CardC_TaskPerAsset } from './CardC_TaskPerAsset';
import { CardD_ReallocPerAsset } from './CardD_ReallocPerAsset';
import { CardE_BatteryPerAsset } from './CardE_BatteryPerAsset';
import { CardF_Unused } from './CardF_Unused';
import { CardH_DispatchRate } from './CardH_DispatchRate';
import { CardA_Allocation } from './CardA_Allocation';
import { CardB_Deployment } from './CardB_Deployment';
import { CardG_Battery } from './CardG_Battery';
import { CardI_Points } from './CardI_Points';

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
  const [unusedData, setUnusedData] = useState<{name: string; value: number; value48?: number}[]>([]);
  const [unusedRate, setUnusedRate] = useState(0);
  const [unusedRate48, setUnusedRate48] = useState(0);

  const [batteryLowData, setBatteryLowData] = useState<{name: string; value: number}[]>([]);
  const [batteryLowRate, setBatteryLowRate] = useState(0);

  const [deploymentCount, setDeploymentCount] = useState(0);
  const [deploymentCountMoM, setDeploymentCountMoM] = useState(0);
  const [deployChartData, setDeployChartData] = useState<{name: string, deploy: number, dispatch: number, rate: number}[]>([]);
  
  const [dispatchRate24h, setDispatchRate24h] = useState(0);
  const [dispatchRate12h, setDispatchRate12h] = useState(0);
  const [dispatchRate6h, setDispatchRate6h] = useState(0);
  const [dispatchRate24hMoM, setDispatchRate24hMoM] = useState(0);
  const [dispatchRate24hCompanyDiff, setDispatchRate24hCompanyDiff] = useState(0);
  const [prevDispatchRate24h, setPrevDispatchRate24h] = useState(0);
  const [companyDispatchRate24h, setCompanyDispatchRate24h] = useState(0);

  const [currentAllocation, setCurrentAllocation] = useState(0);
  const [prevAllocation, setPrevAllocation] = useState(0);
  const [currentOperated, setCurrentOperated] = useState(0);
  const [prevOperated, setPrevOperated] = useState(0);

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
          SELECT SUM(deactivate_72h_count) as unused_72, SUM(deactivate_48h_count) as unused_48, SUM(total_vehicle_count) as total
          FROM unused_72h 
          WHERE middle_region_name = '${camp}' AND ${dateCondition} ${devUnused}
        `;
        const unusedCurrentRes = await query(unusedCurrentQuery);
        let currentUnused72 = 0;
        let currentUnused48 = 0;
        if (unusedCurrentRes.length > 0) {
          const tUnused72 = Number(unusedCurrentRes[0].unused_72) || 0;
          const tUnused48 = Number(unusedCurrentRes[0].unused_48) || 0;
          const tTotal = Number(unusedCurrentRes[0].total) || 0;
          currentUnused72 = tTotal > 0 ? (tUnused72 / tTotal) * 100 : 0;
          currentUnused48 = tTotal > 0 ? (tUnused48 / tTotal) * 100 : 0;
        }
        setUnusedRate(currentUnused72);
        setUnusedRate48(currentUnused48);

        const unusedChartQuery = `
          SELECT 'W' || EXTRACT(WEEK FROM CAST(date AS DATE)) as day, 
                 date_trunc('week', CAST(date AS DATE)) as week_start,
                 SUM(deactivate_72h_count) as unused_72, SUM(deactivate_48h_count) as unused_48, SUM(total_vehicle_count) as total
          FROM unused_72h 
          WHERE middle_region_name = '${camp}' AND ${chart4WeekCondition} ${devUnused}
          GROUP BY day, week_start
          ORDER BY week_start
        `;
        const unusedChartRes = await query(unusedChartQuery);
        setUnusedData(unusedChartRes.map((r: any) => ({ 
          name: r.day, 
          value: r.total > 0 ? (r.unused_72 / r.total) * 100 : 0,
          value48: r.total > 0 ? (r.unused_48 / r.total) * 100 : 0
        })));

        // 2-1. Battery < 20%
        try {
          const batteryCurrentQuery = `
            SELECT SUM(battery_0_20) as b_0_20, SUM(total_vehicle_count) as total
            FROM battery_data 
            WHERE 중지역 = '${camp}' AND dt = (
              SELECT MAX(dt) FROM battery_data WHERE 중지역 = '${camp}' AND EXTRACT(YEAR FROM CAST(dt AS DATE)) = ${year} AND EXTRACT(MONTH FROM CAST(dt AS DATE)) = ${month}
            ) ${getDeviceCond('기기타입')}
          `;
          const batCurrentRes = await query(batteryCurrentQuery);
          if (batCurrentRes.length > 0) {
            const b20 = Number(batCurrentRes[0].b_0_20) || 0;
            const bTotal = Number(batCurrentRes[0].total) || 0;
            setBatteryLowRate(bTotal > 0 ? (b20 / bTotal) * 100 : 0);
          } else {
            setBatteryLowRate(0);
          }

          const batteryChartQuery = `
            SELECT 'W' || EXTRACT(WEEK FROM CAST(dt AS DATE)) as day, 
                   date_trunc('week', CAST(dt AS DATE)) as week_start,
                   SUM(battery_0_20) as b_0_20, SUM(total_vehicle_count) as total
            FROM battery_data 
            WHERE 중지역 = '${camp}' AND 
                  CAST(dt AS DATE) >= (date_trunc('week', CAST('${chartMaxDate}' AS DATE)) - INTERVAL 21 DAY)
                  AND CAST(dt AS DATE) < (date_trunc('week', CAST('${chartMaxDate}' AS DATE)) + INTERVAL 7 DAY)
                  ${getDeviceCond('기기타입')}
            GROUP BY day, week_start
            ORDER BY week_start
          `;
          const batChartRes = await query(batteryChartQuery);
          setBatteryLowData(batChartRes.map((r: any) => ({
            name: r.day,
            value: r.total > 0 ? (r.b_0_20 / r.total) * 100 : 0
          })));
        } catch (e) {
          console.log("Battery data query error (maybe not ready):", e);
        }

        // 3. Allocation (Card C)
        const allocQuery = `SELECT SUM(할당대수)/NULLIF(COUNT(DISTINCT date),0) as avg_alloc, SUM(운행대수) as sum_operated, SUM(할당대수) as sum_alloc FROM daily_stats WHERE middle_region_name = '${camp}' AND ${dateCondition} ${devDaily}`;
        const prevAllocQuery = `SELECT SUM(할당대수)/NULLIF(COUNT(DISTINCT date),0) as avg_alloc, SUM(운행대수) as sum_operated, SUM(할당대수) as sum_alloc FROM daily_stats WHERE middle_region_name = '${camp}' AND ${prevDateCondition} ${devDaily}`;
        const allocR = await query(allocQuery);
        const pAllocR = await query(prevAllocQuery);
        setCurrentAllocation(allocR.length > 0 ? Number(allocR[0].avg_alloc) || 0 : 0);
        setCurrentOperated(allocR.length > 0 ? (Number(allocR[0].sum_operated) / Number(allocR[0].sum_alloc)) * Number(allocR[0].avg_alloc) || 0 : 0);
        setPrevAllocation(pAllocR.length > 0 ? Number(pAllocR[0].avg_alloc) || 0 : 0);
        setPrevOperated(pAllocR.length > 0 ? (Number(pAllocR[0].sum_operated) / Number(pAllocR[0].sum_alloc)) * Number(pAllocR[0].avg_alloc) || 0 : 0);

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

        const deployChartQuery = `
          SELECT 
            'W' || EXTRACT(WEEK FROM CAST(dt AS DATE)) as day,
            date_trunc('week', CAST(dt AS DATE)) as week_start,
            SUM(배치수) as deploy,
            SUM(출루수) as dispatch
          FROM deploy_zone_usages
          WHERE 중지역 = '${camp}' AND ${chart4WeekCondition} ${devZone}
          GROUP BY day, week_start
          ORDER BY week_start
        `;
        const deployChartRes = await query(deployChartQuery);
        setDeployChartData(deployChartRes.map((r: any) => ({
          name: r.day,
          deploy: Number(r.deploy) || 0,
          dispatch: Number(r.dispatch) || 0,
          rate: (Number(r.deploy) || 0) > 0 ? (Number(r.dispatch) / Number(r.deploy)) * 100 : 0
        })));

        const dispatchQuery = `
          SELECT 
            SUM(CASE WHEN "출루까지 시간" <= 24 THEN 배치수 ELSE 0 END) as d24, 
            SUM(CASE WHEN "출루까지 시간" <= 12 THEN 배치수 ELSE 0 END) as d12, 
            SUM(CASE WHEN "출루까지 시간" <= 6 THEN 배치수 ELSE 0 END) as d6, 
            SUM(배치수) as tot 
          FROM deploy_used_time WHERE 중지역 = '${camp}' AND ${dateCondition} ${devZone}`;
        const dispRes = await query(dispatchQuery);
        const cDisp = dispRes.length > 0 ? (Number(dispRes[0].tot) > 0 ? (Number(dispRes[0].d24)/Number(dispRes[0].tot))*100 : 0) : 0;
        setDispatchRate24h(cDisp);
        setDispatchRate12h(dispRes.length > 0 ? (Number(dispRes[0].tot) > 0 ? (Number(dispRes[0].d12)/Number(dispRes[0].tot))*100 : 0) : 0);
        setDispatchRate6h(dispRes.length > 0 ? (Number(dispRes[0].tot) > 0 ? (Number(dispRes[0].d6)/Number(dispRes[0].tot))*100 : 0) : 0);

        const pDispatchQuery = `SELECT SUM(CASE WHEN "출루까지 시간" <= 24 THEN 배치수 ELSE 0 END) as d24, SUM(배치수) as tot FROM deploy_used_time WHERE 중지역 = '${camp}' AND ${prevDateCondition} ${devZone}`;
        const pDispRes = await query(pDispatchQuery);
        const pDisp = pDispRes.length > 0 ? (Number(pDispRes[0].tot) > 0 ? (Number(pDispRes[0].d24)/Number(pDispRes[0].tot))*100 : 0) : 0;
        setPrevDispatchRate24h(pDisp);
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
        setCompanyDispatchRate24h(cDispR);
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
        <div className="col-span-1">
          <CardA_Allocation 
            currentAllocation={currentAllocation} 
            prevAllocation={prevAllocation} 
            currentOperated={currentOperated}
            prevOperated={prevOperated}
            comparisonLabel={dateType === '주 단위' ? '전주' : '전월'} 
            currentLabel={dateType === '주 단위' ? '현재 주' : '현재 월'}
          />
        </div>
        <div className="col-span-2">
          <CardB_Deployment
            deploymentCount={deploymentCount}
            deploymentCountMoM={deploymentCountMoM}
            comparisonLabel={dateType === '주 단위' ? '전주' : '전월'}
            data={deployChartData}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <CardC_TaskPerAsset data={taskChart} currentValue={taskValue} centerAvg={taskCenter} companyAvg={taskCompany} />
        <CardD_ReallocPerAsset data={reallocChart} currentValue={reallocValue} centerAvg={reallocCenter} companyAvg={reallocCompany} />
        <CardE_BatteryPerAsset data={batteryChart} currentValue={batteryValue} centerAvg={batteryCenter} companyAvg={batteryCompany} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <CardF_Unused data={unusedData} currentRate={unusedRate} currentRate48={unusedRate48} />
        <CardG_Battery data={batteryLowData} currentRate={batteryLowRate} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <CardH_DispatchRate 
          dispatchRate24h={dispatchRate24h}
          dispatchRate12h={dispatchRate12h}
          dispatchRate6h={dispatchRate6h}
          dispatchRate24hMoM={dispatchRate24hMoM}
          dispatchRate24hCompanyDiff={dispatchRate24hCompanyDiff}
          prevDispatchRate24h={prevDispatchRate24h}
          companyDispatchRate24h={companyDispatchRate24h}
          comparisonLabel={dateType === '주 단위' ? '전주' : '전월'}
        />
        <CardI_Points 
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
