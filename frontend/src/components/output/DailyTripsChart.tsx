import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Label,
  Legend
} from 'recharts';

interface DailyTripsChartProps {
  data: { day: string; tripsPerAsset: number; revenuePerAsset?: number; precipitation?: number }[];
}

export const DailyTripsChart: React.FC<DailyTripsChartProps> = ({ data }) => {
  const processedData = data.map(d => ({
    ...d,
    precipitation: d.precipitation && d.precipitation < 0 ? 0 : d.precipitation
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-[var(--shadow)] flex flex-col h-[360px]">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800 text-lg">일별 대당회전수 & 대당매출 추이</h3>
      </div>
      <div className="flex-grow w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={processedData}
            margin={{ top: 20, right: 50, left: 10, bottom: 15 }}
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
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
              dx={10}
            />
            <YAxis 
              yAxisId="barRight"
              orientation="right"
              hide={true} 
              domain={[0, 150]} 
            />
            <Tooltip 
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any, name: any) => {
                if (name === '대당매출') return [`${Math.round(value).toLocaleString()}`, name];
                if (name === '대당회전수') return [`${Number(value).toFixed(2)}`, name];
                if (name === '일 총 강수량 (기상청데이터)') return [`${Number(value).toFixed(1)}`, '일 총 강수량'];
                return [value, name];
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tripsPerAsset"
              name="대당회전수"
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
              name="대당매출"
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
            <Bar 
              yAxisId="barRight"
              dataKey="precipitation" 
              fill="#94a3b8" 
              opacity={0.3}
              name="일 총 강수량 (기상청데이터)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
