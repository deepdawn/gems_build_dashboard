import React from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OutputSection } from './components/output/OutputSection';
import { InputSection } from './components/input/InputSection';
import { useDuckDB } from './hooks/useDuckDB';
import { FilterProvider } from './context/FilterContext';

function AppContent() {
  const { isReady, error } = useDuckDB();

  if (error) {
    return <div className="p-8 text-red-500">데이터베이스 로드 중 오류가 발생했습니다: {error.message}</div>;
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium">데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <OutputSection />
      <InputSection />
    </DashboardLayout>
  );
}

function App() {
  return (
    <FilterProvider>
      <AppContent />
    </FilterProvider>
  );
}

export default App;
