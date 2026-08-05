import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Label
} from 'recharts';

interface DailyTripsChartProps {
  data: { day: string; tripsPerAsset: number; revenuePerAsset?: number }[];
}

export const DailyTripsChart: React.FC<DailyTripsChartProps> = ({ data }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-[var(--shadow)] flex flex-col h-[280px]">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800 text-lg">일별 대당회전수 & 대당매출 추이</h3>
      </div>
      <div className="flex-grow w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={10}
              interval="preserveStartEnd"
              minTickGap={15}
            >
              <Label value="일자" offset={-10} position="insideBottom" fill="#64748b" fontSize={12} />
            </XAxis>
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
              dx={-10}
            >
              <Label value="대당회전수 (회)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#64748b" fontSize={12} />
            </YAxis>
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
              dx={10}
            >
              <Label value="대당매출 (원)" angle={90} position="insideRight" style={{ textAnchor: 'middle' }} fill="#64748b" fontSize={12} />
            </YAxis>
            <Tooltip 
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any, name: any) => {
                if (name === 'revenuePerAsset') return [`₩ ${Math.round(value).toLocaleString()}`, '대당매출'];
                if (name === 'tripsPerAsset') return [`${Number(value).toFixed(2)}회`, '대당회전수'];
                return [value, name];
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tripsPerAsset"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }}
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="tripsPerAsset"
                position="top"
                formatter={(val: any) => `${Number(val).toFixed(2)}`}
                fontSize={11}
                fill="#3b82f6"
                fontWeight="bold"
              />
            </Line>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenuePerAsset"
              stroke="#fbbf24"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#fbbf24' }}
              activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="revenuePerAsset"
                position="bottom"
                formatter={(val: any) => `₩${Math.round(val/1000)}k`}
                fontSize={11}
                fill="#d97706"
                fontWeight="bold"
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
