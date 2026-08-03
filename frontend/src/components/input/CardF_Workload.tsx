import React from 'react';
import { Wrench } from 'lucide-react';

export const CardF_Workload: React.FC<{count?: number}> = ({ count = 0 }) => {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm flex flex-col justify-between text-left h-[130px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-[#438B31] text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">B</div>
          <span className="font-bold text-green-900 text-lg">작업량 (배터리 등)</span>
        </div>
        <Wrench size={16} className="text-slate-400" />
      </div>
      <div className="text-[32px] font-black text-slate-800 tracking-tight">{count.toLocaleString()}<span className="text-xl font-bold ml-1 text-slate-600">건</span></div>
    </div>
  );
};
