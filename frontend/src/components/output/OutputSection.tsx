import React, { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { KpiProgressCard } from './KpiProgressCard';
import { useFilters } from '../../context/FilterContext';
import { useDuckDB } from '../../hooks/useDuckDB';

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

  useEffect(() => {
    if (!isReady || !camp || !selectedDate) return;

    const fetchData = async () => {
      try {
        let year = 2026;
        let month = 1;
        
        // 간단한 날짜 파싱 (예: "26년 1월")
        if (dateType === '월 누적(MTD)') {
          const match = selectedDate.match(/(\d+)년\s+(\d+)월/);
          if (match) {
            year = 2000 + parseInt(match[1]);
            month = parseInt(match[2]);
          }
        } else {
           // 주 단위일 경우 로직 추후 보강, 현재는 1월로 기본값
           year = 2026; month = 1; 
        }

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        // 1. 목표 매출 가져오기
        const goalQuery = `
          SELECT SUM(경영목표) as target_revenue, SUM(경영목표할당대수) as target_allocated
          FROM revenue_goal
          WHERE 캠프 = '${camp}' AND 년 = ${year} AND 월 = ${month}
        `;
        const goalRes = await query(goalQuery);
        let targetRevenue = 0;
        let targetAllocated = 0;
        if (goalRes.length > 0) {
          targetRevenue = goalRes[0].target_revenue || 0;
          targetAllocated = goalRes[0].target_allocated || 0;
        }
        const targetRevenuePerAsset = targetAllocated > 0 ? targetRevenue / targetAllocated : 0;

        // 2. 현재 월 실적 가져오기
        const statsQuery = `
          SELECT SUM(revenue) as total_revenue, AVG(할당대수) as avg_allocated, SUM(운행수) as total_trips
          FROM daily_stats 
          WHERE middle_region_name = '${camp}' 
            AND EXTRACT(YEAR FROM date) = ${year} 
            AND EXTRACT(MONTH FROM date) = ${month}
        `;
        const statsRes = await query(statsQuery);
        let totalRevenue = 0;
        let avgAllocated = 0;
        let totalTrips = 0;
        if (statsRes.length > 0) {
          totalRevenue = statsRes[0].total_revenue || 0;
          avgAllocated = statsRes[0].avg_allocated || 0;
          totalTrips = statsRes[0].total_trips || 0;
        }

        // 지바이크 공식: 매출액 = (매출) / (할당대수 * 1.1)
        const revenuePerAsset = avgAllocated > 0 ? totalRevenue / (avgAllocated * 1.1) : 0;
        // 공식: 대당회전수 = 총운행수 / 할당대수
        const tripsPerAsset = avgAllocated > 0 ? totalTrips / avgAllocated : 0;

        // 3. 전월 실적 가져오기 (MoM)
        const prevStatsQuery = `
          SELECT SUM(revenue) as total_revenue, AVG(할당대수) as avg_allocated
          FROM daily_stats 
          WHERE middle_region_name = '${camp}' 
            AND EXTRACT(YEAR FROM date) = ${prevYear} 
            AND EXTRACT(MONTH FROM date) = ${prevMonth}
        `;
        const prevRes = await query(prevStatsQuery);
        let prevTotalRevenue = 0;
        let prevAvgAllocated = 0;
        if (prevRes.length > 0) {
          prevTotalRevenue = prevRes[0].total_revenue || 0;
          prevAvgAllocated = prevRes[0].avg_allocated || 0;
        }
        
        const prevRevenuePerAsset = prevAvgAllocated > 0 ? prevTotalRevenue / (prevAvgAllocated * 1.1) : 0;
        
        const revenueMoM = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
        const revenuePerAssetMoM = prevRevenuePerAsset > 0 ? ((revenuePerAsset - prevRevenuePerAsset) / prevRevenuePerAsset) * 100 : 0;

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

  return (
    <div className="mb-6">
      <h2 className="font-bold text-slate-800 text-lg mb-3 text-left">1. OUTPUT</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <KpiProgressCard
          title="총매출 / 목표%"
          value={`₩ ${(data.totalRevenue / 100000000).toFixed(1)}억`}
          progress={totalProgress}
          mom={data.revenueMoM}
        />
        <KpiProgressCard
          title="대당매출 / 목표%"
          value={`₩ ${Math.round(data.revenuePerAsset).toLocaleString()}`}
          progress={rpaProgress}
          mom={data.revenuePerAssetMoM}
          extraInfo={`대당회전수 ${data.tripsPerAsset.toFixed(2)}`}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800 text-left">
        <Lightbulb size={18} className="text-blue-600 mt-0.5 shrink-0" />
        <p>
          <span className="font-bold">핵심 해석:</span> 총매출 = 할당대수 × 대당매출 / 대당매출은 대당회전수의 영향이 큼
        </p>
      </div>
    </div>
  );
};
