import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CardHProps {
  dispatchRate24h?: number;
  dispatchRate12h?: number;
  dispatchRate6h?: number;
  dispatchRate24hMoM?: number;
  dispatchRate24hCompanyDiff?: number;
  prevDispatchRate24h?: number;
  companyDispatchRate24h?: number;
  comparisonLabel?: string;
}

export const CardH_DispatchRate: React.FC<CardHProps> = ({
  dispatchRate24h = 0,
  dispatchRate12h = 0,
  dispatchRate6h = 0,
  dispatchRate24hMoM = 0,
  dispatchRate24hCompanyDiff = 0,
  prevDispatchRate24h = 0,
  companyDispatchRate24h = 0,
  comparisonLabel = '전월'
}) => {
  const chartData = [
    { name: '출루', value: dispatchRate24h },
    { name: '미출루', value: Math.max(0, 100 - dispatchRate24h) },
  ];
  const chartColor = dispatchRate24h <= 80 ? '#ef4444' : '#3b82f6';

  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm flex flex-col h-[190px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-green-600 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">H</div>
        <span className="font-bold text-green-900 text-lg">n시간 내 출루율</span>
      </div>
      
      <div className="flex justify-between items-center flex-grow mt-4">
        <div className="flex flex-col justify-center">
          <div className="flex gap-10">
            <div>
              <div className="text-[14px] text-slate-500 font-bold mb-1">6h 출루율</div>
              <div className={`text-[32px] font-black leading-none tracking-tight ${dispatchRate6h <= 80 ? 'text-red-500' : 'text-slate-900'}`}>{dispatchRate6h.toFixed(1)}<span className="text-xl">%</span></div>
            </div>
            <div>
              <div className="text-[14px] text-slate-500 font-bold mb-1">12h 출루율</div>
              <div className={`text-[32px] font-black leading-none tracking-tight ${dispatchRate12h <= 80 ? 'text-red-500' : 'text-slate-900'}`}>{dispatchRate12h.toFixed(1)}<span className="text-xl">%</span></div>
            </div>
            <div>
              <div className="text-[14px] text-slate-500 font-bold mb-1">24h 출루율</div>
              <div className={`text-[32px] font-black leading-none tracking-tight ${dispatchRate24h <= 80 ? 'text-red-500' : 'text-slate-900'}`}>{dispatchRate24h.toFixed(1)}<span className="text-xl">%</span></div>
            </div>
          </div>
          <div className="text-[13px] font-semibold text-slate-500 mt-2 whitespace-nowrap">
            {comparisonLabel}({prevDispatchRate24h.toFixed(1)}%) <span className={dispatchRate24hMoM >= 0 ? "text-blue-600" : "text-red-500"}>{dispatchRate24hMoM > 0 ? '+' : ''}{dispatchRate24hMoM.toFixed(1)}%p</span> / 전사({companyDispatchRate24h.toFixed(1)}%) <span className={dispatchRate24hCompanyDiff >= 0 ? "text-blue-600" : "text-red-500"}>{dispatchRate24hCompanyDiff > 0 ? '+' : ''}{dispatchRate24hCompanyDiff.toFixed(1)}%p</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center mr-4 -mt-4">
          <span className="text-[12px] font-bold text-slate-500 mb-2">24h 출루율</span>
          <div className="w-[90px] h-[90px] relative">
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
                    <Cell key={`cell-${index}`} fill={index === 0 ? chartColor : '#e2e8f0'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className={`absolute inset-0 flex items-center justify-center font-black text-[15px] ${dispatchRate24h <= 80 ? 'text-red-500' : 'text-slate-900'}`}>
              {Math.round(dispatchRate24h)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
