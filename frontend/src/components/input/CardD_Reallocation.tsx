import React from 'react';
import { RefreshCw } from 'lucide-react';

export const CardD_Reallocation: React.FC<{count?: number}> = ({ count = 0 }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[var(--shadow)] flex flex-col justify-between text-left">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-500 font-bold text-sm">D. 재배치 관리</h3>
        <RefreshCw size={16} className="text-slate-400" />
      </div>
      <div className="text-2xl font-black text-slate-800">{count.toLocaleString()}건</div>
    </div>
  );
};
