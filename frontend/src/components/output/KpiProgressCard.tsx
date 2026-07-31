import React from 'react';

interface Props {
  title: string;
  value: string;
  goalPercent: number;
  comparisonText: string;
  comparisonColor?: 'blue' | 'red';
}

export const KpiProgressCard: React.FC<Props> = ({ 
  title, 
  value, 
  goalPercent, 
  comparisonText,
  comparisonColor = 'blue'
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between min-h-[220px]">
      <div className="text-center font-bold text-blue-700 text-lg mb-4">{title}</div>
      <div className="flex justify-between items-end mb-4 px-2">
        <div className="text-4xl font-black tracking-tight">{value}</div>
        <div className="text-right">
          <div className="text-sm text-slate-500 font-bold mb-1">목표달성</div>
          <div className="text-2xl font-black text-blue-800 tracking-tight">{goalPercent.toFixed(1)}%</div>
        </div>
      </div>
      
      {/* Progress Bar Area */}
      <div className="relative mb-2 mt-6 px-3">
        <div className="flex justify-between text-xs text-slate-500 font-medium mb-2 px-1">
          <span>0%</span>
          <span className="absolute font-bold text-slate-700" style={{ left: `${goalPercent}%`, transform: 'translateX(-50%)', top: '-22px' }}>
            {goalPercent.toFixed(1)}%
          </span>
          <span>100%</span>
        </div>
        <div className="h-4 bg-slate-200 rounded-full w-full relative border border-slate-300">
          <div 
            className="h-full bg-blue-800 rounded-full" 
            style={{ width: `${Math.min(goalPercent, 100)}%` }}
          ></div>
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-4 border-slate-200 rounded-full shadow-md"
            style={{ left: `calc(${Math.min(goalPercent, 100)}% - 12px)` }}
          ></div>
        </div>
      </div>
      
      <div className="text-center mt-4 font-bold text-sm">
        <span className={comparisonColor === 'blue' ? 'text-blue-600' : 'text-red-500'}>
          {comparisonText}
        </span>
      </div>
    </div>
  );
};
