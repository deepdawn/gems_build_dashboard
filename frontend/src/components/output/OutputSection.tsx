import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { KpiProgressCard } from './KpiProgressCard';
import { DailyTripsChart } from './DailyTripsChart';
import { useFilters } from '../../context/FilterContext';
import { useDuckDB } from '../../hooks/useDuckDB';
import { registerPartitions } from '../../lib/duckdb';

export const OutputSection: React.FC = () => {
  const { camp, dateType, selectedDate } = useFilters();
  const { isReady, query } = useDuckDB();
  
  const [data, setData] = useState({
    totalRevenue: 0,
    targetRevenue: 0,
    revenuePerAsset: 0,
    targetRevenuePerAsset: 0,
    tripsPerAsset: 0,
    revenueMoM: 0,
    revenuePerAssetMoM: 0,
  });
  const [dailyTrips, setDailyTrips] = useState<{ day: string; tripsPerAsset: number }[]>([]);

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
            // ISO week 기준 해당 주가 속한 월 계산
            const d = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            month = d.getUTCMonth() + 1;
          }
        }

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYearForMonth = month === 1 ? year - 1 : year;
        const prevWeek = week === 1 ? 52 : week - 1;
        const prevYearForWeek = week === 1 ? year - 1 : year;

        // 파티션 로드 (현재 월 & 전월)
        await registerPartitions(year, month);

        // 1. 목표 매출 및 대당매출 가져오기
        const goalQuery = `
          SELECT SUM(경영목표) as target_revenue, 
                 SUM(경영목표할당대수) as target_allocated,
                 SUM(경영목표대당매출 * 경영목표할당대수) / NULLIF(SUM(경영목표할당대수), 0) as target_revenue_per_asset
          FROM revenue_goal
          WHERE 캠프 = '${camp}' AND 년 = ${year} AND 월 = ${month}
        `;
        const goalRes = await query(goalQuery);
        let targetRevenue = 0;
        let targetRevenuePerAsset = 0;
        if (goalRes.length > 0) {
          const rawTarget = goalRes[0].target_revenue || 0;
          if (isWeekly) {
            // 그 달의 주 수로 나눈 주 평균 목표 값을 주별 목표로 설정
            const daysInMonth = new Date(year, month, 0).getDate();
            const weeksInMonth = daysInMonth / 7.0;
            targetRevenue = rawTarget / weeksInMonth;
          } else {
            targetRevenue = rawTarget;
          }
          targetRevenuePerAsset = goalRes[0].target_revenue_per_asset || 0;
        }

        // 2. 현재 실적 가져오기
        let dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = ${month}`;
        if (isWeekly) {
          dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(WEEK FROM CAST(date AS DATE)) = ${week}`;
        }

        const statsQuery = `
          SELECT SUM(revenue) as total_revenue, 
                 SUM(할당대수) as sum_allocated, 
                 SUM(운행수) as total_trips,
                 MAX(CASE WHEN revenue > 0 THEN EXTRACT(DAY FROM CAST(date AS DATE)) ELSE 0 END) as max_day_month,
                 MAX(CASE WHEN revenue > 0 THEN EXTRACT(ISODOW FROM CAST(date AS DATE)) ELSE 0 END) as max_day_week
          FROM daily_stats 
          WHERE middle_region_name = '${camp}' AND ${dateCondition}
        `;
        const statsRes = await query(statsQuery);
        let totalRevenue = 0;
        let sumAllocated = 0;
        let totalTrips = 0;
        let maxDayMonth = 31;
        let maxDayWeek = 7;
        
        if (statsRes.length > 0) {
          totalRevenue = Number(statsRes[0].total_revenue) || 0;
          sumAllocated = Number(statsRes[0].sum_allocated) || 0;
          totalTrips = Number(statsRes[0].total_trips) || 0;
          // max_day_month나 week가 0이면 데이터가 아예 없는 것이므로 기본값 31/7 유지
          maxDayMonth = Number(statsRes[0].max_day_month) || 31;
          maxDayWeek = Number(statsRes[0].max_day_week) || 7;
        }

        // 지바이크 공식: 대당매출 = sum(매출) / sum(할당대수)
        const revenuePerAsset = sumAllocated > 0 ? totalRevenue / sumAllocated : 0;
        // 지바이크 공식: 대당회전수 = 총운행수 / 총할당대수
        const tripsPerAsset = sumAllocated > 0 ? totalTrips / sumAllocated : 0;

        // 3. 비교 실적 가져오기 (전월 or 전주)
        let prevDateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${prevYearForMonth} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = ${prevMonth}`;
        let prevDayLimitCondition = `EXTRACT(DAY FROM CAST(date AS DATE)) <= ${maxDayMonth}`;
        
        if (isWeekly) {
          prevDateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${prevYearForWeek} AND EXTRACT(WEEK FROM CAST(date AS DATE)) = ${prevWeek}`;
          prevDayLimitCondition = `EXTRACT(ISODOW FROM CAST(date AS DATE)) <= ${maxDayWeek}`;
        }

        const prevStatsQuery = `
          SELECT 
            SUM(CASE WHEN ${prevDayLimitCondition} THEN revenue ELSE 0 END) as limited_total_revenue,
            SUM(revenue) as full_total_revenue,
            SUM(할당대수) as full_sum_allocated
          FROM daily_stats 
          WHERE middle_region_name = '${camp}' AND ${prevDateCondition}
        `;
        const prevRes = await query(prevStatsQuery);
        let prevTotalRevenueForComparison = 0;
        let prevFullTotalRevenue = 0;
        let prevFullSumAllocated = 0;
        
        if (prevRes.length > 0) {
          prevTotalRevenueForComparison = Number(prevRes[0].limited_total_revenue) || 0;
          prevFullTotalRevenue = Number(prevRes[0].full_total_revenue) || 0;
          prevFullSumAllocated = Number(prevRes[0].full_sum_allocated) || 0;
        }
        
        const prevRevenuePerAsset = prevFullSumAllocated > 0 ? prevFullTotalRevenue / prevFullSumAllocated : 0;
        
        const revenueMoM = prevTotalRevenueForComparison > 0 ? ((totalRevenue - prevTotalRevenueForComparison) / prevTotalRevenueForComparison) * 100 : 0;
        const revenuePerAssetMoM = prevRevenuePerAsset > 0 ? ((revenuePerAsset - prevRevenuePerAsset) / prevRevenuePerAsset) * 100 : 0;

        // 4. 일별 대당회전수 추이 가져오기
        const dailyTripsQuery = `
          SELECT strftime(date, '%m-%d') as day, 
                 SUM(운행수) as total_trips, 
                 SUM(할당대수) as sum_allocated
          FROM daily_stats
          WHERE middle_region_name = '${camp}' AND ${dateCondition}
          GROUP BY day
          ORDER BY day
        `;
        const dailyTripsRes = await query(dailyTripsQuery);
        const dailyTripsChartData = dailyTripsRes.map((r: any) => ({
          day: r.day,
          tripsPerAsset: Number(r.sum_allocated) > 0 ? Number(r.total_trips) / Number(r.sum_allocated) : 0
        }));
        setDailyTrips(dailyTripsChartData);

        setData({
          totalRevenue,
          targetRevenue,
          revenuePerAsset,
          targetRevenuePerAsset,
          tripsPerAsset,
          revenueMoM,
          revenuePerAssetMoM
        });

      } catch (err) {
        console.error("Failed to fetch output data:", err);
      }
    };

    fetchData();
  }, [isReady, camp, dateType, selectedDate]);

  const totalProgress = data.targetRevenue > 0 ? (data.totalRevenue / data.targetRevenue) * 100 : 0;
  const rpaProgress = data.targetRevenuePerAsset > 0 ? (data.revenuePerAsset / data.targetRevenuePerAsset) * 100 : 0;
  const comparisonLabel = dateType === '주 단위' ? '전주' : '전월';

  return (
    <div className="mb-6">
      <h2 className="font-bold text-slate-800 text-lg mb-3 text-left">1. OUTPUT</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <KpiProgressCard
          title="총매출 / 목표%"
          value={`₩ ${(data.totalRevenue / 100000000).toFixed(1)}억`}
          goalPercent={totalProgress}
          comparisonText={`${comparisonLabel} 동기간 대비 ${data.revenueMoM > 0 ? '+' : ''}${data.revenueMoM.toFixed(1)}%`}
          targetValue={`₩ ${(data.targetRevenue / 100000000).toFixed(1)}억`}
        />
        <KpiProgressCard
          title="대당매출 / 목표%"
          value={`₩ ${Math.round(data.revenuePerAsset).toLocaleString()}`}
          goalPercent={rpaProgress}
          comparisonText={`${comparisonLabel} 대비 ${data.revenuePerAssetMoM > 0 ? '+' : ''}${data.revenuePerAssetMoM.toFixed(1)}%`}
          extraInfo={`대당회전수 ${data.tripsPerAsset.toFixed(2)}`}
          targetValue={`₩ ${Math.round(data.targetRevenuePerAsset).toLocaleString()}`}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800 text-left mb-6">
        <Lightbulb size={18} className="text-blue-600 mt-0.5 shrink-0" />
        <p>
          <span className="font-bold">핵심 해석:</span> 총매출 = 할당대수 × 대당매출 / 대당매출은 대당회전수의 영향이 큼
        </p>
      </div>

      <DailyTripsChart data={dailyTrips} />
    </div>
  );
};
