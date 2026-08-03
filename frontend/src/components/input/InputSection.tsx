import React, { useEffect, useState } from 'react';
import { CardA_Unused } from './CardA_Unused';
import { CardB_Deployment } from './CardB_Deployment';
import { CardC_Allocation } from './CardC_Allocation';
import { CardD_Reallocation } from './CardD_Reallocation';
import { CardE_Points } from './CardE_Points';
import { CardF_Workload } from './CardF_Workload';
import { useFilters } from '../../context/FilterContext';
import { useDuckDB } from '../../hooks/useDuckDB';

export const InputSection: React.FC = () => {
  const { camp, dateType, selectedDate } = useFilters();
  const { isReady, query } = useDuckDB();
  
  const [unusedData, setUnusedData] = useState<{name: string; value: number}[]>([]);
  const [unusedRate, setUnusedRate] = useState(0);
  const [reallocationCount, setReallocationCount] = useState(0);
  const [batteryCount, setBatteryCount] = useState(0);

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

        let dateCondition = `EXTRACT(YEAR FROM date) = ${year} AND EXTRACT(MONTH FROM date) = ${month}`;
        if (isWeekly) {
          dateCondition = `EXTRACT(YEAR FROM date) = ${year} AND EXTRACT(WEEK FROM date) = ${week}`;
        }

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
        {/* Card A: 72h 미사용 -> pass the actual data */}
        <CardA_Unused data={unusedData} currentRate={unusedRate} />
        
        {/* Card B: 배치존 (현재 데이터 빈 폴더이므로 더미 또는 0처리) */}
        <CardB_Deployment />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Card C: 할당대수 (더미 유지 또는 추후 구현) */}
        <CardC_Allocation />
        
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <CardD_Reallocation count={reallocationCount} />
            <CardF_Workload count={batteryCount} />
          </div>
          <CardE_Points />
        </div>
      </div>
    </div>
  );
};
