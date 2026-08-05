import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CardBProps {
  deploymentCount?: number;
  deploymentCountMoM?: number;
  comparisonLabel?: string;
  data: {
    name: string;
    deploy: number;
    dispatch: number;
    rate: number;
  }[];
}

export const CardB_Deployment: React.FC<CardBProps> = ({
  deploymentCount = 0,
  deploymentCountMoM = 0,
  comparisonLabel = '전월',
  data = []
}) => {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-5 shadow-sm flex flex-col h-[190px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-green-600 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">B</div>
        <span className="font-bold text-green-900 text-lg">배치존 배치수</span>
      </div>
      
      <div className="flex justify-between items-end flex-grow">
        <div className="w-[140px]">
          <div className="text-[13px] text-slate-500 font-bold mb-1">기간 누적 배치수</div>
          <div className="text-[36px] font-black leading-none mb-2 tracking-tight">{Math.round(deploymentCount).toLocaleString()}<span className="text-xl">회</span></div>
          <div className="text-[13px] font-semibold text-slate-500">{comparisonLabel} 대비 <span className={deploymentCountMoM >= 0 ? "text-blue-600" : "text-red-500"}>{deploymentCountMoM > 0 ? '+' : ''}{deploymentCountMoM.toFixed(1)}%</span></div>
        </div>
        
        <div className="flex-1 h-[130px] ml-2 -mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => Math.round(value).toLocaleString()} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Tooltip 
                contentStyle={{ fontSize: '11px', borderRadius: '4px' }}
                formatter={(value: any, name: any) => {
                  if (name === '출루율') return [`${Number(value).toFixed(1)}%`, name];
                  return [Math.round(value).toLocaleString(), name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
              <Bar yAxisId="left" dataKey="deploy" name="배치수" fill="#86B971" radius={[2,2,0,0]} isAnimationActive={false} barSize={8} />
              <Line yAxisId="left" dataKey="dispatch" name="출루수" type="monotone" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
              <Line yAxisId="right" dataKey="rate" name="출루율" type="monotone" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
