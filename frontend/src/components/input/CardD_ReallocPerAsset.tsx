import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

interface CardDProps {
  data?: { name: string; value: number }[];
  currentValue?: number;
  centerAvg?: number;
  companyAvg?: number;
  periodLabel?: string;
}

export const CardD_ReallocPerAsset: React.FC<CardDProps> = ({ data = [], currentValue = 0, centerAvg = 0, companyAvg = 0, periodLabel = '' }) => {
  const centerDiff = currentValue - centerAvg;
  const companyDiff = currentValue - companyAvg;

  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm text-left flex flex-col h-[190px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-green-600 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">D</div>
          <span className="font-bold text-green-900 text-lg">대당 재배치</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-slate-800">{periodLabel ? `${periodLabel}: ` : ''}{currentValue.toFixed(2)}건</div>
          <div className="text-[10px] text-slate-500 font-medium">
            센터평균({centerAvg.toFixed(2)}): <span className={centerDiff >= 0 ? 'text-blue-500' : 'text-red-500'}>{centerDiff > 0 ? '+' : ''}{centerDiff.toFixed(2)}</span>
            {' | '}전사({companyAvg.toFixed(2)}): <span className={companyDiff >= 0 ? 'text-blue-500' : 'text-red-500'}>{companyDiff > 0 ? '+' : ''}{companyDiff.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="flex-grow mt-2 relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 15, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(2)}건`, '대당 재배치']} />
              <Line type="monotone" dataKey="value" stroke="#438B31" strokeWidth={2} dot={{ r: 3, fill: '#438B31' }} activeDot={{ r: 5 }}>
                <LabelList dataKey="value" position="top" formatter={(val: any) => `${Number(val).toFixed(2)}`} fontSize={10} fill="#438B31" fontWeight="bold" offset={8} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">데이터 없음</div>
        )}
      </div>
    </div>
  );
};
