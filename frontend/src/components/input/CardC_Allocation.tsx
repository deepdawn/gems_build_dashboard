import React from 'react';
import { ArrowRight } from 'lucide-react';

export const CardC_Allocation: React.FC = () => {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm flex flex-col h-[190px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-[#438B31] text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">C</div>
        <span className="font-bold text-green-900 text-lg">할당대수의 증감</span>
      </div>
      
      <div className="flex justify-between items-center flex-grow">
        <div>
          <div className="text-[52px] font-black leading-none mb-2 tracking-tight">+38대</div>
          <div className="text-[14px] font-semibold text-slate-500 ml-1 mt-3">전월 <span className="text-blue-600">+12대</span></div>
        </div>
        
        <div className="flex items-end gap-3 h-[100px] pb-2 pr-2">
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-bold text-slate-700 mb-1">1,482대</span>
            <div className="w-[50px] h-[55px] bg-[#86B971] rounded-t-sm"></div>
            <span className="text-[12px] font-semibold text-slate-500 mt-1">전월</span>
          </div>
          <div className="pb-[25px]">
            <ArrowRight size={28} className="text-[#438B31]" strokeWidth={3.5} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-bold text-slate-700 mb-1">1,520대</span>
            <div className="w-[50px] h-[65px] bg-[#438B31] rounded-t-sm shadow-sm"></div>
            <span className="text-[12px] text-red-500 mt-1 font-bold">금월</span>
          </div>
        </div>
      </div>
    </div>
  );
};
