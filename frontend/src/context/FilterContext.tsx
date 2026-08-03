import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type FilterContextType = {
  camp: string;
  setCamp: (v: string) => void;
  dateType: string;
  setDateType: (v: string) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Helper to get previous week string e.g., "26-W30"
function getPreviousWeekString() {
  const now = new Date();
  // subtract 7 days to get previous week
  now.setDate(now.getDate() - 7);
  
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${year}-W${week}`;
}

// Helper to get current month string e.g., "26년 7월"
function getCurrentMonthString() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = now.getMonth() + 1;
  return `${year}년 ${month}월`;
}

export function FilterProvider({ children }: { children: ReactNode }) {
  // Default values
  const [camp, setCamp] = useState('고양1캠프');
  const [dateType, setDateType] = useState('월 누적(MTD)');
  const [selectedDate, setSelectedDate] = useState(getCurrentMonthString());

  return (
    <FilterContext.Provider 
      value={{ camp, setCamp, dateType, setDateType, selectedDate, setSelectedDate }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within FilterProvider');
  return context;
}
