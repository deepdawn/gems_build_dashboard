import React, { createContext, useContext, useState, ReactNode } from 'react';

type FilterContextType = {
  camp: string;
  setCamp: (v: string) => void;
  dateType: string;
  setDateType: (v: string) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  // Default values
  const [camp, setCamp] = useState('고양1캠프');
  const [dateType, setDateType] = useState('월 누적(MTD)');
  const [selectedDate, setSelectedDate] = useState('26년 1월'); // Based on dummy data year 26

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
