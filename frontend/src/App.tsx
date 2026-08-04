
import { useState } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OutputSection } from './components/output/OutputSection';
import { InputSection } from './components/input/InputSection';
import { useDuckDB } from './hooks/useDuckDB';
import { FilterProvider } from './context/FilterContext';
import { KeplerMapPage } from './components/map/KeplerMapPage';

function AppContent() {
  const { isReady, error } = useDuckDB();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map'>('dashboard');

  if (error) {
    return <div className="p-8 text-red-500">데이터베이스 로드 중 오류가 발생했습니다: {error.message}</div>;
  }

  return (
    <>
      {!isReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="text-blue-800 font-bold text-2xl flex items-center bg-white/80 px-8 py-5 rounded-2xl shadow-lg border border-blue-100">
            <span>데이터 로딩 중</span>
            <span className="inline-block w-6 text-left animate-ellipsis"></span>
          </div>
        </div>
      )}
      <div className={!isReady ? "pointer-events-none opacity-50" : "transition-opacity duration-300"}>
        <DashboardLayout>
          <div className="flex gap-4 mb-4 pb-2 border-b border-slate-200">
            <button 
              className={`px-4 py-2 font-bold rounded-md ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 지표 대시보드
            </button>
            <button 
              className={`px-4 py-2 font-bold rounded-md ${activeTab === 'map' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setActiveTab('map')}
            >
              🗺️ 배치존 발굴 맵 (GeoMap)
            </button>
          </div>

          {activeTab === 'dashboard' ? (
            <>
              <OutputSection />
              <InputSection />
            </>
          ) : (
            <KeplerMapPage />
          )}
        </DashboardLayout>
      </div>
    </>
  );
}

function App() {
  return (
    <FilterProvider>
      <AppContent />
    </FilterProvider>
  );
}

export default App;
