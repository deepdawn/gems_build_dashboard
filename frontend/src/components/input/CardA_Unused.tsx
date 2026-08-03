
import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

type Props = {
  data?: { name: string; value: number }[];
  currentRate?: number;
};

export const CardA_Unused: React.FC<Props> = ({ data = [], currentRate = 0 }) => {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm text-left flex flex-col h-[190px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-[#438B31] text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">D</div>
          <span className="font-bold text-green-900 text-lg">72시간 미사용</span>
        </div>
        <div className="text-2xl font-black text-slate-800">{currentRate.toFixed(1)}%</div>
      </div>
      <div className="flex-grow mt-2 relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, '미사용률']} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }}>
                <LabelList dataKey="value" position="top" formatter={(val: any) => `${Number(val).toFixed(1)}%`} fontSize={10} fill="#3b82f6" fontWeight="bold" offset={8} />
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
