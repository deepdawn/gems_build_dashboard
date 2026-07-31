import React from 'react';
import { Wrench } from 'lucide-react';

export const CardF_Workload: React.FC<{count?: number}> = ({ count = 0 }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[var(--shadow)] flex flex-col justify-between text-left">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-500 font-bold text-sm">F. 작업량 (배터리 등)</h3>
        <Wrench size={16} className="text-slate-400" />
      </div>
      <div className="text-2xl font-black text-slate-800">{count.toLocaleString()}건</div>
    </div>
  );
};
