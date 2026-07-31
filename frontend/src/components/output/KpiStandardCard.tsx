import React from 'react';

interface Props {
  title: string;
  value: string;
  comparisonText: React.ReactNode;
}

export const KpiStandardCard: React.FC<Props> = ({ title, value, comparisonText }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between min-h-[220px]">
      <div className="text-center font-bold text-blue-700 text-lg mb-6">{title}</div>
      <div className="text-center text-[54px] font-black mb-8 mt-2 tracking-tight">
        {value}
      </div>
      <div className="text-center font-medium text-[13px] text-slate-600">
        비고: {comparisonText}
      </div>
    </div>
  );
};
