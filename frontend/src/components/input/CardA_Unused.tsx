
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

type Props = {
  data?: { name: string; value: number }[];
  currentRate?: number;
};

export const CardA_Unused: React.FC<Props> = ({ data = [], currentRate = 0 }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[var(--shadow)] text-left flex flex-col justify-between">
      <div>
        <h3 className="text-slate-500 font-bold text-sm mb-1">A. 72시간 미사용</h3>
        <div className="text-2xl font-black text-slate-800">{currentRate.toFixed(1)}%</div>
      </div>
      <div className="h-16 mt-2">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, '미사용률']} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">데이터 없음</div>
        )}
      </div>
    </div>
  );
};
