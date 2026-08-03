import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, CalendarDays, ArrowRight } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDuckDB } from '../../hooks/useDuckDB';

export const FilterBar: React.FC = () => {
  const { camp, setCamp, dateType, setDateType, selectedDate, setSelectedDate } = useFilters();
  const { isReady, query } = useDuckDB();
  const [camps, setCamps] = useState<string[]>(['고양1캠프']);

  useEffect(() => {
    if (isReady) {
      query('SELECT DISTINCT middle_region_name FROM daily_stats WHERE middle_region_name IS NOT NULL ORDER BY middle_region_name')
        .then(res => {
          if (res.length > 0) {
             const loadedCamps = res.map((r: any) => r.middle_region_name);
             setCamps(loadedCamps);
             if (!loadedCamps.includes(camp)) {
               setCamp(loadedCamps[0]); // Reset if not found
             }
          }
        }).catch(err => console.error("Failed to load camps", err));
    }
  }, [isReady]);

  // 월 단위 옵션 생성: 25년 1월 ~ 26년 12월
  const mtdOptions: string[] = [];
  for (let year = 25; year <= 26; year++) {
    for (let month = 1; month <= 12; month++) {
      mtdOptions.push(`${year}년 ${month}월`);
    }
  }

  // 주 단위 옵션 생성: 25-W1 ~ 26-W53
  const weeklyOptions: string[] = [];
  for (let year = 25; year <= 26; year++) {
    for (let week = 1; week <= 53; week++) {
      weeklyOptions.push(`${year}-W${week}`);
    }
  }

  const dateOptions = dateType === '월 누적(MTD)' ? mtdOptions : weeklyOptions;

  const handleDateTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setDateType(newType);
    
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    
    if (newType === '월 누적(MTD)') {
      const month = now.getMonth() + 1; // 1-12
      setSelectedDate(`${year}년 ${month}월`);
    } else {
      // Calculate previous week
      now.setDate(now.getDate() - 7);
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const prevYear = String(d.getUTCFullYear()).slice(-2);
      setSelectedDate(`${prevYear}-W${week}`);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 p-4 mb-4 rounded-lg flex flex-wrap gap-8 justify-center items-center text-slate-700 text-[15px]">
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
      </div>
    </div>
  );
};
