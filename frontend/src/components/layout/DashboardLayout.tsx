import React from 'react';
import { FilterBar } from './FilterBar';

interface Props {
  children: React.ReactNode;
  activeTab?: string;
}

export const DashboardLayout: React.FC<Props> = ({ children, activeTab }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-8 max-w-[1400px] mx-auto">
      <header className="bg-white px-8 py-4 border-b border-slate-200 text-center mb-4">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">RS그룹 주간 회의용 대시보드 <span className="font-medium text-2xl">(프로토타입)</span></h1>
      </header>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 flex flex-col gap-2 text-sm text-slate-700">
        <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
          <span className="bg-slate-200 p-1 rounded">ℹ️</span> 핵심 지표 산식 안내
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 list-disc list-inside px-1">
          <li><strong>대당회전수 (기기당 이용 횟수)</strong> = 총 운행 수 / 총 할당대수</li>
          <li><strong>대당매출 (기기당 매출)</strong> = 총 매출 / 총 할당대수</li>
          <li><strong>배치존 활성도</strong> = 운영 배치존 수 / 관리 배치존 수</li>
          <li><strong>목표 달성률</strong> = 총 매출 / 목표 매출 (MTD 비교)</li>
        </ul>
        <div className="mt-1 px-1 text-slate-500 text-[13px]">
          * 주 단위 조회 시 <strong>주간 목표 매출</strong>은 해당 월의 전체 일수를 7로 나눈 주차 수(Week) 비중에 따라 월간 목표를 분할하여 산출합니다.
        </div>
      </div>
      
      <FilterBar activeTab={activeTab} />
      
      <main className="flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
};
