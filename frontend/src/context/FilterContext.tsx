import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { registerPartitions } from '../lib/duckdb';
import { useDuckDB } from '../hooks/useDuckDB';

type FilterContextType = {
  center: string;
  setCenter: (v: string) => void;
  camp: string;
  setCamp: (v: string) => void;
  dateType: string;
  setDateType: (v: string) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  device: string;
  setDevice: (v: string) => void;
  partitionsReady: boolean;
  partitionsError: string | null;
  /** 데이터 쿼리를 새로 실행하도록 강제 트리거하는 카운터 */
  queryTrigger: number;
  loadingState: { input: boolean; output: boolean; map: boolean };
  setLoadingState: React.Dispatch<React.SetStateAction<{ input: boolean; output: boolean; map: boolean }>>;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Helper to get current month string e.g., "26년 8월"
function getCurrentMonthString() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = now.getMonth() + 1;
  return `${year}년 ${month}월`;
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const { isReady } = useDuckDB();
  // Default values
  const [center, setCenter] = useState('강남RS');
  const [camp, setCamp] = useState('서초캠프');
  const [dateType, setDateType] = useState('월 누적(MTD)');
  const [selectedDate, setSelectedDate] = useState(getCurrentMonthString());
  const [device, setDevice] = useState('전체');
  const [partitionsReady, setPartitionsReady] = useState(false);
  const [partitionsError, setPartitionsError] = useState<string | null>(null);
  const [queryTrigger, setQueryTrigger] = useState(0);
  const [loadingState, setLoadingState] = useState({ input: false, output: false, map: false });
  const loadingRef = useRef(false);

  // 파티션 로딩: isReady, selectedDate, dateType 가 변할 때
  useEffect(() => {
    if (!isReady) return;
    if (loadingRef.current) return;

    let cancelled = false;

    const load = async () => {
      loadingRef.current = true;
      setPartitionsReady(false);
      setPartitionsError(null);

      let year = 2026;
      let month = 1;
      const isWeekly = dateType === '주 단위';

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
          const week = parseInt(match[2]);
          const d = new Date(year, 0, 1 + (week - 1) * 7);
          month = d.getMonth() + 1;
        }
      }

      try {
        await registerPartitions(year, month);
      } catch (err: any) {
        console.error("Failed to load partitions", err);
        setPartitionsError(err.toString());
      }

      loadingRef.current = false;

      if (!cancelled) {
        setPartitionsReady(true);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [isReady, selectedDate, dateType]);

  // partitionsReady가 true로 바뀔 때마다 queryTrigger를 증가시켜
  // 하위 컴포넌트들이 확실히 재실행되도록 함
  useEffect(() => {
    if (partitionsReady) {
      // 약간의 지연을 주어 React가 모든 상태 변경을 반영한 뒤에 쿼리 실행
      const timer = setTimeout(() => {
        setQueryTrigger(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [partitionsReady]);

  return (
    <FilterContext.Provider
      value={{ 
        center, setCenter, camp, setCamp, dateType, setDateType, 
        selectedDate, setSelectedDate, device, setDevice, 
        partitionsReady, partitionsError, queryTrigger,
        loadingState, setLoadingState 
      }}
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
