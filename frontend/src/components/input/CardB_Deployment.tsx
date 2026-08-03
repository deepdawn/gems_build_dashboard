import React from 'react';
import { BarChart, Bar, ResponsiveContainer, ReferenceLine } from 'recharts';

const data = [
  { name: '5주', value: 60, rate: 70 },
  { name: '4주', value: 60, rate: 71 },
  { name: '3주', value: 61, rate: 72 },
  { name: '2주', value: 61, rate: 73 },
  { name: '1주', value: 61, rate: 73 },
  { name: '금주', value: 61.2, rate: 73.5 },
];

interface CardBProps {
  deploymentCount?: number;
  deploymentCountMoM?: number;
  dispatchRate24h?: number;
  dispatchRate24hMoM?: number;
  dispatchRate24hCompanyDiff?: number;
  comparisonLabel?: string;
}

export const CardB_Deployment: React.FC<CardBProps> = ({
  deploymentCount = 0,
  deploymentCountMoM = 0,
  dispatchRate24h = 0,
  dispatchRate24hMoM = 0,
  dispatchRate24hCompanyDiff = 0,
  comparisonLabel = '전월'
}) => {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm flex flex-col h-[190px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-[#438B31] text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">D</div>
        <span className="font-bold text-green-900 text-lg">배치존 배치수 / 24h 출루율</span>
      </div>
      
      <div className="flex justify-between items-end flex-grow">
        <div className="flex gap-4">
          <div>
            <div className="text-[13px] text-slate-500 font-bold mb-1">배치존 배치수</div>
            <div className="text-[36px] font-black leading-none mb-2 tracking-tight">{Math.round(deploymentCount).toLocaleString()}<span className="text-xl">회</span></div>
            <div className="text-[13px] font-semibold text-slate-500">{comparisonLabel} <span className={deploymentCountMoM >= 0 ? "text-blue-600" : "text-red-500"}>{deploymentCountMoM > 0 ? '+' : ''}{deploymentCountMoM.toFixed(1)}%</span></div>
          </div>
          <div>
            <div className="text-[13px] text-slate-500 font-bold mb-1">24h 출루율</div>
            <div className="text-[36px] font-black leading-none mb-2 tracking-tight">{dispatchRate24h.toFixed(1)}<span className="text-xl">%</span></div>
            <div className="text-[13px] font-semibold text-slate-500">
              {comparisonLabel} <span className={dispatchRate24hMoM >= 0 ? "text-blue-600" : "text-red-500"}>{dispatchRate24hMoM > 0 ? '+' : ''}{dispatchRate24hMoM.toFixed(1)}%p</span> / 전사 <span className={dispatchRate24hCompanyDiff >= 0 ? "text-blue-600" : "text-red-500"}>{dispatchRate24hCompanyDiff > 0 ? '+' : ''}{dispatchRate24hCompanyDiff.toFixed(1)}%p</span>
            </div>
          </div>
        </div>
        
        <div className="w-[130px] h-[90px] relative flex flex-col justify-end">
          <div className="absolute right-0 top-0 text-[10px] text-slate-500 font-medium">*할당대수 기준</div>
          <div className="flex justify-end text-[10px] gap-2 mb-1 mt-4">
             <span className="flex items-center gap-1 font-bold text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-[#86B971]"></span>배치수</span>
             <span className="flex items-center gap-1 font-bold text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>출루율</span>
          </div>
          <div className="h-[55px] mt-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barSize={10}>
                <ReferenceLine y={50} stroke="#2563eb" strokeDasharray="3 3" />
                <Bar dataKey="value" fill="#86B971" radius={[2,2,0,0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
