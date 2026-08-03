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


// Helper to get current month string e.g., "26년 7월"
function getCurrentMonthString() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = now.getMonth() + 1;
  return `${year}년 ${month}월`;
}

export function FilterProvider({ children }: { children: ReactNode }) {
  // Default values
  const [camp, setCamp] = useState('서초캠프');
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
