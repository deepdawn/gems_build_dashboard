import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, CalendarDays, ArrowRight, Building2 } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDuckDB } from '../../hooks/useDuckDB';

export const FilterBar: React.FC = () => {
  const { 
    center, setCenter, 
    camp, setCamp, 
    dateType, setDateType, 
    selectedDate, setSelectedDate,
    device, setDevice,
    queryTrigger
  } = useFilters();
  const { isReady, query } = useDuckDB();
  const [centers, setCenters] = useState<string[]>(['강남RS']);
  const [camps, setCamps] = useState<string[]>(['서초캠프']);

  useEffect(() => {
    if (isReady && queryTrigger > 0) {
      query("SELECT DISTINCT 센터 as center FROM revenue_goal WHERE 센터 IS NOT NULL AND 센터 != '계' ORDER BY 센터")
        .then(res => {
          if (res.length > 0) {
             const loadedCenters = res.map((r: any) => r.center);
             setCenters(loadedCenters);
             if (!loadedCenters.includes(center)) {
               setCenter(loadedCenters[0]); 
             }
          }
        }).catch(err => console.error("Failed to load centers", err));
    }
  }, [isReady, queryTrigger]);

  useEffect(() => {
    if (isReady && queryTrigger > 0 && center) {
      query(`SELECT DISTINCT 캠프 as camp FROM revenue_goal WHERE 센터 = '${center}' AND 캠프 IS NOT NULL AND 캠프 != '계' ORDER BY 캠프`)
        .then(res => {
          if (res.length > 0) {
             const loadedCamps = res.map((r: any) => r.camp);
             setCamps(loadedCamps);
             if (!loadedCamps.includes(camp)) {
               setCamp(loadedCamps[0]); 
             }
          }
        }).catch(err => console.error("Failed to load camps", err));
    }
  }, [isReady, queryTrigger, center]);

  const now = new Date();
  const currentYear = Number(String(now.getFullYear()).slice(-2)); // e.g. 26
  const currentMonth = now.getMonth() + 1;

  // Calculate PREVIOUS ISO week (for max week limit) since current week is ongoing
  const prevDate = new Date(now.getTime() - 7 * 86400000);
  const dPrev = new Date(Date.UTC(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate()));
  const dayNumPrev = dPrev.getUTCDay() || 7;
  dPrev.setUTCDate(dPrev.getUTCDate() + 4 - dayNumPrev);
  const yearStartPrev = new Date(Date.UTC(dPrev.getUTCFullYear(), 0, 1));
  const prevWeek = Math.ceil((((dPrev.getTime() - yearStartPrev.getTime()) / 86400000) + 1) / 7);
  const prevWeekYear = Number(String(dPrev.getUTCFullYear()).slice(-2));

  // 월 단위 옵션 생성: 25년 1월 ~ 현재 월
  const mtdOptions: string[] = [];
  for (let year = 25; year <= currentYear; year++) {
    const maxMonth = year === currentYear ? currentMonth : 12;
    for (let month = 1; month <= maxMonth; month++) {
      mtdOptions.push(`${year}년 ${month}월`);
    }
  }

  // 주 단위 옵션 생성: 25-W1 ~ 전주(완료된 주차)
  const weeklyOptions: string[] = [];
  for (let year = 25; year <= prevWeekYear; year++) {
    const maxWeek = year === prevWeekYear ? prevWeek : 53; 
    for (let week = 1; week <= maxWeek; week++) {
      weeklyOptions.push(`${year}-W${week}`);
    }
  }

  const dateOptions = dateType === '월 누적(MTD)' ? mtdOptions : weeklyOptions;

  const handleDateTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setDateType(newType);
    
    if (newType === '월 누적(MTD)') {
      setSelectedDate(`${currentYear}년 ${currentMonth}월`);
    } else {
      setSelectedDate(`${prevWeekYear}-W${prevWeek}`);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 p-4 mb-4 rounded-lg flex flex-wrap gap-8 justify-center items-center text-slate-700 text-[15px]">
      
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-blue-700" />
        <span className="font-bold">센터선택:</span>
        <select 
          className="bg-transparent font-medium focus:outline-none cursor-pointer border-b border-slate-300 pb-0.5"
          value={center}
          onChange={(e) => setCenter(e.target.value)}
        >
          {centers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <MapPin size={18} className="text-blue-700" />
        <span className="font-bold">캠프선택:</span>
        <select 
          className="bg-transparent font-medium focus:outline-none cursor-pointer border-b border-slate-300 pb-0.5"
          value={camp}
          onChange={(e) => setCamp(e.target.value)}
        >
          {camps.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <Calendar size={18} className="text-blue-700" />
        <span className="font-bold">날짜 타입:</span>
        <select 
          className="bg-transparent font-medium focus:outline-none cursor-pointer border-b border-slate-300 pb-0.5"
          value={dateType}
          onChange={handleDateTypeChange}
        >
          <option value="월 누적(MTD)">월 누적(MTD)</option>
          <option value="주 단위">주 단위</option>
        </select>
      </div>
      
      <div className="flex items-center text-red-500">
        <ArrowRight size={24} strokeWidth={3} />
      </div>
      
      <div className="flex items-center gap-2">
        <CalendarDays size={18} className="text-blue-700" />
        <span className="font-bold">날짜 선택:</span>
        <select 
          className="bg-transparent font-medium focus:outline-none cursor-pointer border-b border-slate-300 pb-0.5"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          {dateOptions.map(opt => (
             <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">기기</span>
          <select 
            value={device} 
            onChange={(e) => setDevice(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="전체">전체</option>
            <option value="자전거">자전거</option>
            <option value="킥보드">킥보드</option>
          </select>
        </div>
      </div>
    </div>
  );
};
