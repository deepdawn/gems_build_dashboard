import React from 'react';
import { FilterBar } from './FilterBar';

interface Props {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-8 max-w-[1400px] mx-auto">
      <header className="mb-6 text-center">
        <h1 className="text-[32px] font-black tracking-tight">
          RS캠프 회의 전 사전 공유용 운영지표 대시보드 <span className="font-medium text-2xl">(스케치)</span>
        </h1>
        <p className="text-red-500 font-bold mt-2 text-lg">더미데이터 기반 예시</p>
      </header>
      
      <FilterBar />
      
      <main className="flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
};
