import React from 'react';
import { FilterBar } from './FilterBar';

interface Props {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-8 max-w-[1400px] mx-auto">
      <header className="bg-white px-8 py-4 border-b border-slate-200 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">RS그룹 주간 회의용 대시보드 <span className="font-medium text-2xl">(스케치)</span></h1>
      </header>
      
      <FilterBar />
      
      <main className="flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
};
