import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CardCProps {
  currentAllocation: number;
  prevAllocation: number;
  currentOperated?: number;
  prevOperated?: number;
  comparisonLabel?: string;
  currentLabel?: string;
}

export const CardA_Allocation: React.FC<CardCProps> = ({ 
  currentAllocation = 0, 
  prevAllocation = 0,
  currentOperated = 0,
  prevOperated = 0,
  comparisonLabel = '전월',
  currentLabel = '현재 월'
}) => {
  const diff = currentAllocation - prevAllocation;
  const isPositive = diff >= 0;
  const diffText = `${isPositive ? '+' : ''}${Math.round(diff).toLocaleString()}대`;
  
  let currentUtil = currentAllocation > 0 ? (currentOperated / currentAllocation) * 100 : 0;
  let prevUtil = prevAllocation > 0 ? (prevOperated / prevAllocation) * 100 : 0;
  
  // 가동률이 100%를 초과하는 데이터 이상치 보정 (최대 100% 캡)
  currentUtil = Math.min(currentUtil, 100);
  prevUtil = Math.min(prevUtil, 100);
  
  const utilDiff = currentUtil - prevUtil;
  
  // 간단한 바 높이 스케일링 (최대 65px 기준)
  const maxVal = Math.max(currentAllocation, prevAllocation, 1);
  const currentHeight = Math.max((currentAllocation / maxVal) * 65, 10);
  const prevHeight = Math.max((prevAllocation / maxVal) * 65, 10);

  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm flex flex-col h-[190px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-green-600 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">A</div>
        <span className="font-bold text-green-900 text-lg">할당대수 & 가동률</span>
      </div>
      
      <div className="flex justify-between items-center flex-grow mt-2">
        <div>
          <div className="text-[13px] text-slate-500 font-bold mb-1">가동률</div>
          <div className="flex items-end gap-2 mb-2">
            <div className="text-[36px] font-black leading-none tracking-tight">
              {currentUtil.toFixed(1)}<span className="text-xl">%</span>
            </div>
          </div>
          <div className="text-[13px] font-semibold text-slate-500 mb-1">
            {comparisonLabel} <span className={utilDiff >= 0 ? "text-blue-600" : "text-red-500"}>{utilDiff > 0 ? '+' : ''}{utilDiff.toFixed(1)}%p</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 pb-2 pr-2">
          <div className="flex items-end gap-3 h-[85px]">
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-bold text-slate-700 mb-1">{Math.round(prevAllocation).toLocaleString()}대</span>
              <div className="w-[45px] bg-[#86B971] rounded-t-sm transition-all duration-500" style={{ height: `${prevHeight}px` }}></div>
              <span className="text-[12px] font-semibold text-slate-500 mt-1">{comparisonLabel}</span>
            </div>
            <div className="pb-[20px]">
              <ArrowRight size={24} className="text-[#438B31]" strokeWidth={3.5} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-bold text-slate-700 mb-1">{Math.round(currentAllocation).toLocaleString()}대</span>
              <div className="w-[45px] bg-[#438B31] rounded-t-sm shadow-sm transition-all duration-500" style={{ height: `${currentHeight}px` }}></div>
              <span className="text-[12px] text-red-500 mt-1 font-bold">{currentLabel}</span>
            </div>
          </div>
          <div className="text-[10px] font-medium text-slate-500 mt-1">
            *할당대수 증감: <span className={isPositive ? "text-blue-600 font-bold" : "text-red-500 font-bold"}>{diffText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

