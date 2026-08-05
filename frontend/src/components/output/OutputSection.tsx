import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { KpiProgressCard } from './KpiProgressCard';
import { DailyTripsChart } from './DailyTripsChart';
import { useFilters } from '../../context/FilterContext';
import { useDuckDB } from '../../hooks/useDuckDB';

export const OutputSection: React.FC = () => {
  const { center, camp, dateType, selectedDate, device, queryTrigger } = useFilters();
  const { isReady, query } = useDuckDB();
  
  const [data, setData] = useState({
    totalRevenue: 0,
    targetRevenue: 0,
    revenuePerAsset: 0,
    targetRevenuePerAsset: 0,
    targetRevenuePerAssetBike: 0,
    targetRevenuePerAssetKick: 0,
    tripsPerAsset: 0,
    revenueMoM: 0,
    revenuePerAssetMoM: 0,
    centerRevenueAvg: 0,
    companyRevenueAvg: 0,
    centerRpaAvg: 0,
    companyRpaAvg: 0
  });
  const [dailyTrips, setDailyTrips] = useState<{ day: string; tripsPerAsset: number; revenuePerAsset: number }[]>([]);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !camp || !selectedDate) return;
    let ignore = false;

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
            const d = new Date(year, 0, 1 + (week - 1) * 7);
            month = d.getMonth() + 1;
          }
        }

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYearForMonth = month === 1 ? year - 1 : year;
        const prevWeek = week === 1 ? 52 : week - 1;
        const prevYearForWeek = week === 1 ? year - 1 : year;

        let dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = ${month}`;
        let prevDateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${prevYearForMonth} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = ${prevMonth}`;
        if (isWeekly) {
          dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(WEEK FROM CAST(date AS DATE)) = ${week}`;
          prevDateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${prevYearForWeek} AND EXTRACT(WEEK FROM CAST(date AS DATE)) = ${prevWeek}`;
        }

        const getDeviceCond = (col: string) => {
          if (device === '자전거') return `AND ${col} IN ('자전거', 'bicycle')`;
          if (device === '킥보드') return `AND ${col} IN ('킥보드', 'scooter')`;
          return '';
        };
        const devDaily = getDeviceCond('기기구분');

        // 1. Target Revenue
        const goalQuery = `
          SELECT 기종, SUM(경영목표) as target_revenue, 
                 SUM(경영목표할당대수) as sum_target_alloc,
                 SUM(경영목표대당매출 * 경영목표할당대수) as sum_target_rev_weighted
          FROM revenue_goal
          WHERE 캠프 = '${camp}' AND 년 = ${year} AND 월 = ${month}
          GROUP BY 기종
        `;
        const goalRes = await query(goalQuery);
        let targetRevenue = 0;
        let targetRevenuePerAsset = 0;
        let targetRevenuePerAssetBike = 0;
        let targetRevenuePerAssetKick = 0;
        
        let sumRev = 0;
        let sumAlloc = 0;
        let sumWeighted = 0;
        
        for (const row of goalRes) {
            const rev = Number(row.target_revenue) || 0;
            const alloc = Number(row.sum_target_alloc) || 0;
            const weighted = Number(row.sum_target_rev_weighted) || 0;
            const type = row.기종;
            
            if (type === '자전거') {
                targetRevenuePerAssetBike = alloc > 0 ? weighted / alloc : 0;
            } else if (type === '킥보드') {
                targetRevenuePerAssetKick = alloc > 0 ? weighted / alloc : 0;
            }
            
            if (device === '전체' || device === type) {
                sumRev += rev;
                sumAlloc += alloc;
                sumWeighted += weighted;
            }
        }

        if (isWeekly) {
          const daysInMonth = new Date(year, month, 0).getDate();
          targetRevenue = sumRev / (daysInMonth / 7.0);
        } else {
          targetRevenue = sumRev;
        }
        targetRevenuePerAsset = sumAlloc > 0 ? sumWeighted / sumAlloc : 0;

        // 2. Current Stats (Camp, Center, Company)
        const statsQuery = `
          SELECT middle_region_name as camp, high_region_name as center,
                 SUM(revenue) as total_revenue, 
                 SUM(할당대수) as sum_allocated, 
                 SUM(운행수) as total_trips,
                 MAX(CASE WHEN revenue > 0 THEN EXTRACT(DAY FROM CAST(date AS DATE)) ELSE 0 END) as max_day_month,
                 MAX(CASE WHEN revenue > 0 THEN EXTRACT(ISODOW FROM CAST(date AS DATE)) ELSE 0 END) as max_day_week
          FROM daily_stats 
          WHERE ${dateCondition} ${devDaily}
          GROUP BY camp, center
        `;
        const statsRes = await query(statsQuery);
        
        let campStats = statsRes.find((r: any) => r.camp === camp);
        let maxDayMonth = 31, maxDayWeek = 7;
        let totalRevenue = 0, sumAllocated = 0, totalTrips = 0;
        
        if (campStats) {
          totalRevenue = Number(campStats.total_revenue) || 0;
          sumAllocated = Number(campStats.sum_allocated) || 0;
          totalTrips = Number(campStats.total_trips) || 0;
          maxDayMonth = Number(campStats.max_day_month) || 31;
          maxDayWeek = Number(campStats.max_day_week) || 7;
        }

        const revenuePerAsset = sumAllocated > 0 ? totalRevenue / sumAllocated : 0;
        const tripsPerAsset = sumAllocated > 0 ? totalTrips / sumAllocated : 0;

        // Center / Company Averages
        let centerTotalRev = 0, centerTotalAlloc = 0;
        let companyTotalRev = 0, companyTotalAlloc = 0;
        let centerCampCount = 0;

        for (const row of statsRes) {
          const rev = Number(row.total_revenue) || 0;
          const alloc = Number(row.sum_allocated) || 0;
          
          companyTotalRev += rev;
          companyTotalAlloc += alloc;
          
          if (row.center && row.center.includes(center)) {
            centerTotalRev += rev;
            centerTotalAlloc += alloc;
            centerCampCount++;
          }
        }
        
        const campCount = statsRes.length;
        const centerRevenueAvg = centerCampCount > 0 ? centerTotalRev / centerCampCount : 0;
        const companyRevenueAvg = campCount > 0 ? companyTotalRev / campCount : 0;
        const centerRpaAvg = centerTotalAlloc > 0 ? centerTotalRev / centerTotalAlloc : 0;
        const companyRpaAvg = companyTotalAlloc > 0 ? companyTotalRev / companyTotalAlloc : 0;

        // 3. Prev Stats for MoM
        let prevDayLimitCondition = `EXTRACT(DAY FROM CAST(date AS DATE)) <= ${maxDayMonth}`;
        if (isWeekly) prevDayLimitCondition = `EXTRACT(ISODOW FROM CAST(date AS DATE)) <= ${maxDayWeek}`;

        const prevStatsQuery = `
          SELECT 
            SUM(CASE WHEN ${prevDayLimitCondition} THEN revenue ELSE 0 END) as limited_total_revenue,
            SUM(revenue) as full_total_revenue,
            SUM(할당대수) as full_sum_allocated
          FROM daily_stats 
          WHERE middle_region_name = '${camp}' AND ${prevDateCondition} ${devDaily}
        `;
        const prevRes = await query(prevStatsQuery);
        let prevTotalRevenueForComparison = 0, prevFullTotalRevenue = 0, prevFullSumAllocated = 0;
        
        if (prevRes.length > 0) {
          prevTotalRevenueForComparison = Number(prevRes[0].limited_total_revenue) || 0;
          prevFullTotalRevenue = Number(prevRes[0].full_total_revenue) || 0;
          prevFullSumAllocated = Number(prevRes[0].full_sum_allocated) || 0;
        }
        
        const prevRevenuePerAsset = prevFullSumAllocated > 0 ? prevFullTotalRevenue / prevFullSumAllocated : 0;
        const revenueMoM = prevTotalRevenueForComparison > 0 ? ((totalRevenue - prevTotalRevenueForComparison) / prevTotalRevenueForComparison) * 100 : 0;
        const revenuePerAssetMoM = prevRevenuePerAsset > 0 ? ((revenuePerAsset - prevRevenuePerAsset) / prevRevenuePerAsset) * 100 : 0;

        // 4. Daily Trips & Revenue (Daily Chart)
        const dailyTripsQuery = `
          SELECT 
            strftime(date, '%m-%d') as day,
            SUM(운행수) as total_trips, 
            SUM(할당대수) as avg_allocated,
            SUM(revenue) as total_revenue
          FROM daily_stats
          WHERE middle_region_name = '${camp}' AND ${dateCondition} ${devDaily}
          GROUP BY day
          ORDER BY day
        `;
        const dailyTripsRes = await query(dailyTripsQuery);
        const dailyTripsChartData = dailyTripsRes.map((r: any) => {
          const alloc = Number(r.avg_allocated) || 0;
          return {
            day: r.day,
            tripsPerAsset: alloc > 0 ? Number(r.total_trips) / alloc : 0,
            revenuePerAsset: alloc > 0 ? Number(r.total_revenue) / alloc : 0
          };
        });

        if (ignore) return;
        setDailyTrips(dailyTripsChartData);
        setData({
          totalRevenue, targetRevenue, revenuePerAsset, targetRevenuePerAsset, 
          targetRevenuePerAssetBike, targetRevenuePerAssetKick, tripsPerAsset,
          revenueMoM, revenuePerAssetMoM, centerRevenueAvg, companyRevenueAvg, centerRpaAvg, companyRpaAvg
        });

      } catch (err: any) {
        console.error("Failed to fetch output data:", err);
        setDebugError(err.toString());
      }
    };

    if (queryTrigger > 0) {
      fetchData();
    }

    return () => { ignore = true; };
  }, [isReady, queryTrigger, center, camp, dateType, selectedDate, device]);

  const totalProgress = data.targetRevenue > 0 ? (data.totalRevenue / data.targetRevenue) * 100 : 0;
  const rpaProgress = data.targetRevenuePerAsset > 0 ? (data.revenuePerAsset / data.targetRevenuePerAsset) * 100 : 0;
  const comparisonLabel = dateType === '주 단위' ? '전주' : '전월';

  return (
    <div className="mb-8">
      <h2 className="font-bold text-slate-800 text-lg mb-3 text-left">1. OUTPUT</h2>
      {debugError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {debugError}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <KpiProgressCard
          title="총매출 / 목표%"
          value={`₩ ${(data.totalRevenue / 100000000).toFixed(1)}억`}
          goalPercent={totalProgress}
          comparisonText={`${comparisonLabel} 동기간 대비 ${data.revenueMoM > 0 ? '+' : ''}${data.revenueMoM.toFixed(1)}%`}
          targetValue={`₩ ${(data.targetRevenue / 100000000).toFixed(1)}억`}
          avgComparisonText={
            <span>
              센터평균: ₩{(data.centerRevenueAvg / 100000000).toFixed(1)}억 | 전사평균: ₩{(data.companyRevenueAvg / 100000000).toFixed(1)}억
            </span>
          }
        />
        <KpiProgressCard
          title="대당매출 / 목표%"
          value={`₩ ${Math.round(data.revenuePerAsset).toLocaleString()}`}
          goalPercent={rpaProgress}
          comparisonText={`${comparisonLabel} 대비 ${data.revenuePerAssetMoM > 0 ? '+' : ''}${data.revenuePerAssetMoM.toFixed(1)}%`}
          extraInfo={`대당회전수 ${data.tripsPerAsset.toFixed(2)}`}
          targetValue={`₩ ${Math.round(data.targetRevenuePerAsset).toLocaleString()}`}
          targetValueSub={
            device === '전체' ? (
              <div className="flex gap-2 text-[10px] text-slate-400 mt-1 justify-end items-center">
                <span className="font-medium whitespace-nowrap">자전거 ₩ {Math.round(data.targetRevenuePerAssetBike).toLocaleString()}</span>
                <span className="text-slate-300">|</span>
                <span className="font-medium whitespace-nowrap">킥보드 ₩ {Math.round(data.targetRevenuePerAssetKick).toLocaleString()}</span>
              </div>
            ) : null
          }
          avgComparisonText={
            <span>
              센터평균: ₩{Math.round(data.centerRpaAvg).toLocaleString()} | 전사평균: ₩{Math.round(data.companyRpaAvg).toLocaleString()}
            </span>
          }
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800 text-left mb-6">
        <Lightbulb size={18} className="text-blue-600 mt-0.5 shrink-0" />
        <p>
          <span className="font-bold">핵심 해석:</span> 총매출 = 할당대수 × 대당매출 | 대당매출은 운행 단가도 영향을 미치지만 대당회전수의 영향이 큼
        </p>
      </div>

      <DailyTripsChart data={dailyTrips} />
    </div>
  );
};
