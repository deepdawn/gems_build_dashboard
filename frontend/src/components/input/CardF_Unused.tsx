import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

interface CardFProps {
  data?: { name: string; value: number; value48?: number }[];
  currentRate?: number;
  currentRate48?: number;
}

export const CardF_Unused: React.FC<CardFProps> = ({ data = [], currentRate = 0, currentRate48 = 0 }) => {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm text-left flex flex-col h-[190px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-green-600 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">F</div>
          <span className="font-bold text-green-900 text-lg">48시간 & 72시간 미사용 기기 비율</span>
        </div>
        <div className="text-right flex items-center gap-2">
          <div className="flex flex-col items-end mr-1">
            <span className="text-[10px] text-yellow-600 font-bold leading-none">48h</span>
            <span className="text-sm font-black text-slate-800">{currentRate48.toFixed(1)}%</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-200"></div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-blue-600 font-bold leading-none">72h</span>
            <span className="text-2xl font-black text-slate-800 leading-none">{currentRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      <div className="flex-grow mt-2 relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 15, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value: any, name: any) => [`${Number(value).toFixed(1)}%`, name === 'value' ? '72h' : '48h']} />
              <Line type="monotone" dataKey="value48" stroke="#eab308" strokeWidth={2} dot={{ r: 3, fill: '#eab308' }} activeDot={{ r: 5 }}>
                <LabelList dataKey="value48" position="top" formatter={(val: any) => `${Number(val).toFixed(1)}%`} fontSize={10} fill="#eab308" fontWeight="bold" offset={8} />
              </Line>
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }}>
                <LabelList dataKey="value" position="bottom" formatter={(val: any) => `${Number(val).toFixed(1)}%`} fontSize={10} fill="#3b82f6" fontWeight="bold" offset={8} />
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
