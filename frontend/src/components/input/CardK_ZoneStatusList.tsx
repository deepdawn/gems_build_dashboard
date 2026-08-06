import React from 'react';

export interface ZoneStatusData {
  zoneName: string;
  totalDeploy: number;
  status: '운영 배치존' | '미관리 배치존 의심';
}

interface CardKProps {
  data: ZoneStatusData[];
  periodLabel?: string;
}

export const CardK_ZoneStatusList: React.FC<CardKProps> = ({ data, periodLabel }) => {
  return (
    <div className="bg-white border border-rose-200 rounded-lg p-5 shadow-sm text-left col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-rose-500 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-sm shadow-sm">K</div>
        <span className="font-bold text-rose-900 text-lg">배치포인트 관리 상세 {periodLabel && <span className="text-sm font-normal text-slate-500 ml-2">({periodLabel})</span>}</span>
      </div>
      
      <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-slate-200 rounded-md">
        <table className="w-full text-sm text-left text-slate-700">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 shadow-sm z-10">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">배치존명</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">기간 내 총 배치 수</th>
              <th scope="col" className="px-4 py-3 font-bold text-center whitespace-nowrap">배치존 상태</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900 truncate max-w-[200px]" title={row.zoneName}>{row.zoneName}</td>
                  <td className="px-4 py-2 text-right">{row.totalDeploy.toLocaleString()}대</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${row.status === '운영 배치존' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
