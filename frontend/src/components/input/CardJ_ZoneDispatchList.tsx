import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export interface ZoneDispatchData {
  zoneName: string;
  d6: number;
  d12: number;
  d24: number;
  totalDeploy: number;
  empCount: number;
  alightCount: number;
  diff24: number;
}

interface CardJProps {
  data: ZoneDispatchData[];
  periodLabel?: string;
}

export const CardJ_ZoneDispatchList: React.FC<CardJProps> = ({ data, periodLabel }) => {
  return (
    <div className="bg-white border border-blue-200 rounded-lg p-5 shadow-sm text-left col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">J</div>
        <span className="font-bold text-blue-900 text-lg">n시간 내 출루율 목록 {periodLabel && <span className="text-sm font-normal text-slate-500 ml-2">({periodLabel})</span>}</span>
      </div>
      
      <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-slate-200 rounded-md">
        <table className="w-full text-sm text-left text-slate-700">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 shadow-sm z-10">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">배치존명</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">총 배치수</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">직원 배치 수</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">고객 하차 수</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">6h 출루율</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">12h 출루율</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">24h 출루율</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">전주 대비 24h</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900 truncate max-w-[200px]" title={row.zoneName}>{row.zoneName}</td>
                  <td className="px-4 py-2 text-right">{row.totalDeploy.toLocaleString()}대</td>
                  <td className="px-4 py-2 text-right">{row.empCount.toLocaleString()}대</td>
                  <td className="px-4 py-2 text-right">{row.alightCount.toLocaleString()}대</td>
                  <td className="px-4 py-2 text-right">{row.d6.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{row.d12.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right font-bold">{row.d24.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right flex items-center justify-end gap-1">
                    {row.diff24 > 0 ? (
                      <span className="text-blue-600 font-medium flex items-center"><ArrowUp size={14} className="mr-0.5"/>{row.diff24.toFixed(1)}%p</span>
                    ) : row.diff24 < 0 ? (
                      <span className="text-red-600 font-medium flex items-center"><ArrowDown size={14} className="mr-0.5"/>{Math.abs(row.diff24).toFixed(1)}%p</span>
                    ) : (
                      <span className="text-slate-400 font-medium flex items-center"><Minus size={14} className="mr-0.5"/>0.0%p</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
