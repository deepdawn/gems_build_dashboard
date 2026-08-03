import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#438B31', '#e2e8f0'];

interface CardEProps {
  managementZoneCount?: number;
  activeZoneRate?: number;
  activeZoneRateMoM?: number;
  activeZoneRateCompanyDiff?: number;
  prevActiveZoneRate?: number;
  companyActiveZoneRate?: number;
  comparisonLabel?: string;
}

export const CardE_Points: React.FC<CardEProps> = ({
  managementZoneCount = 0,
  activeZoneRate = 0,
  activeZoneRateMoM = 0,
  activeZoneRateCompanyDiff = 0,
  prevActiveZoneRate = 0,
  companyActiveZoneRate = 0,
  comparisonLabel = '전월'
}) => {
  const chartData = [
    { name: '배치', value: activeZoneRate },
    { name: '미배치', value: Math.max(0, 100 - activeZoneRate) },
  ];

  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm flex flex-col h-[190px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-[#438B31] text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">F</div>
        <span className="font-bold text-green-900 text-lg">배치포인트 관리</span>
      </div>
      
      <div className="flex justify-between items-center flex-grow mt-2">
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-500 mb-2 text-center whitespace-nowrap">캠프 소속 배치존</span>
            <div className="text-[40px] font-black tracking-tight leading-none text-center">{Math.round(managementZoneCount).toLocaleString()}<span className="text-lg">개</span></div>
          </div>
          <div className="w-[1px] h-[50px] bg-slate-200 self-center"></div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-500 mb-2 text-center whitespace-nowrap">배치존 중 1대 이상 배치</span>
            <div className="text-[40px] font-black tracking-tight leading-none text-center">{Math.round(activeZoneRate)}<span className="text-lg">%</span></div>
          </div>
        </div>
        
        <div className="w-[90px] h-[90px] relative mr-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={30}
                outerRadius={45}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-[15px] text-green-900">
            {Math.round(activeZoneRate)}%
          </div>
        </div>
      </div>
      
      <div className="text-[13px] font-semibold text-slate-500 mt-2">
        {comparisonLabel}({prevActiveZoneRate.toFixed(1)}%) <span className={activeZoneRateMoM >= 0 ? "text-blue-600" : "text-red-500"}>{activeZoneRateMoM > 0 ? '+' : ''}{activeZoneRateMoM.toFixed(1)}%p</span> / 전사({companyActiveZoneRate.toFixed(1)}%) <span className={activeZoneRateCompanyDiff >= 0 ? "text-blue-600" : "text-red-500"}>{activeZoneRateCompanyDiff > 0 ? '+' : ''}{activeZoneRateCompanyDiff.toFixed(1)}%p</span>
      </div>
    </div>
  );
};
