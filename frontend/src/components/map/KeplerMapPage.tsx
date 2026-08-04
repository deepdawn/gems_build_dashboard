import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
// @ts-ignore
import KeplerGl from '@kepler.gl/components';
// @ts-ignore
import { addDataToMap } from '@kepler.gl/actions';
import { useDuckDB } from '../../hooks/useDuckDB';
import { useFilters } from '../../context/FilterContext';

// Set up Mapbox token if required by kepler (Kepler usually needs one for the base map)
// For prototyping, we can just use a dummy or public one, or the user can provide it later.
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''; // Add your Mapbox token to .env as VITE_MAPBOX_TOKEN

export function KeplerMapPage() {
  const dispatch = useDispatch();
  const { isReady, query } = useDuckDB();
  const { center, camp, device, dateType, selectedDate, queryTrigger, partitionsReady } = useFilters();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!isReady || !partitionsReady || !camp) return;

    let cancelled = false;

    const loadData = async () => {
      try {
        let year = 2026;
        let month = 1;
        let week = 1;
        const isWeekly = dateType === '주 단위';

        if (!isWeekly) {
          const match = selectedDate.match(/(\d+)년\s+(\d+)월/);
          if (match) {
            year = 2000 + parseInt(match[1]);
            month = parseInt(match[2]);
          }
        } else {
          const match = selectedDate.match(/(\d+)-W(\d+)/);
          if (match) {
            year = 2000 + parseInt(match[1]);
            week = parseInt(match[2]);
            const d = new Date(year, 0, 1 + (week - 1) * 7);
            month = d.getMonth() + 1;
          }
        }

        let dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = ${month}`;
        if (isWeekly) {
          dateCondition = `EXTRACT(YEAR FROM CAST(date AS DATE)) = ${year} AND EXTRACT(WEEK FROM CAST(date AS DATE)) = ${week}`;
        }

        const centerCondOrders = center === '전체' ? '' : `AND high_region_name = '${center}'`;
        const campCondOrders = camp === '전체' ? '' : `AND middle_region_name = '${camp}'`;
        const ordersQuery = `
          SELECT 
            start_lat, start_lng, 
            end_lat, end_lng, 
            기기구분
          FROM orders
          WHERE 1=1
            ${centerCondOrders}
            ${campCondOrders}
            AND ${dateCondition}
            AND start_lat IS NOT NULL AND start_lng IS NOT NULL
            AND end_lat IS NOT NULL AND end_lng IS NOT NULL
        `;
        const ordersRes = await query(ordersQuery);

        // 2. Load Deploy Spots
        const centerCondSpots = center === '전체' ? '' : `AND high_region_name = '${center}'`;
        const campCondSpots = camp === '전체' ? '' : `AND mid_region_name = '${camp}'`;
        const spotsQuery = `
          SELECT 
            lat, lng, 
            배치존명, 설정대수
          FROM deploy_spot
          WHERE 1=1
            ${centerCondSpots}
            ${campCondSpots}
            AND lat IS NOT NULL AND lng IS NOT NULL
        `;
        const spotsRes = await query(spotsQuery);

        if (cancelled) return;

        // Format for Kepler
        const datasets = [
          {
            info: {
              label: '운행 데이터 (Orders)',
              id: 'orders_data'
            },
            data: {
              fields: [
                { name: 'start_lat', type: 'real' },
                { name: 'start_lng', type: 'real' },
                { name: 'end_lat', type: 'real' },
                { name: 'end_lng', type: 'real' },
                { name: '기기구분', type: 'string' }
              ],
              rows: ordersRes.map(r => [r.start_lat, r.start_lng, r.end_lat, r.end_lng, r.기기구분])
            }
          },
          {
            info: {
              label: '현재 배치존 (Deploy Spots)',
              id: 'spots_data'
            },
            data: {
              fields: [
                { name: 'lat', type: 'real' },
                { name: 'lng', type: 'real' },
                { name: '배치존명', type: 'string' },
                { name: '설정대수', type: 'integer' }
              ],
              rows: spotsRes.map(r => [r.lat, r.lng, r.배치존명, r.설정대수])
            }
          }
        ];

        // Default Kepler Config (Optional, but sets up layers automatically)
        const config = {
          version: 'v1' as const,
          config: {
            visState: {
              filters: [],
              layers: [
                {
                  id: 'start_heatmap',
                  type: 'heatmap',
                  config: {
                    dataId: 'orders_data',
                    label: '출발지 히트맵',
                    color: [18, 147, 154], // Teal/Blueish
                    columns: { lat: 'start_lat', lng: 'start_lng' },
                    isVisible: true,
                    visConfig: { radius: 20, intensity: 1, colorRange: { colors: ["#000000", "#1E96BE", "#28AEA8", "#32C592", "#3CDD7C", "#46F466"] } }
                  }
                },
                {
                  id: 'end_heatmap',
                  type: 'heatmap',
                  config: {
                    dataId: 'orders_data',
                    label: '도착지 히트맵',
                    color: [221, 104, 108], // Red/Pinkish
                    columns: { lat: 'end_lat', lng: 'end_lng' },
                    isVisible: true,
                    visConfig: { radius: 20, intensity: 1, colorRange: { colors: ["#000000", "#7B2C3F", "#A0354E", "#C53E5C", "#EA476B", "#FF507A"] } }
                  }
                },
                {
                  id: 'spots_point',
                  type: 'point',
                  config: {
                    dataId: 'spots_data',
                    label: '배치존 위치',
                    color: [255, 203, 153], // Yellow/Orange
                    columns: { lat: 'lat', lng: 'lng' },
                    isVisible: true,
                    visConfig: { radius: 10, fixedRadius: false, opacity: 0.8, outline: false }
                  }
                }
              ],
              interactionConfig: {
                tooltip: {
                  fieldsToShow: {
                    spots_data: [{ name: '배치존명', format: null }, { name: '설정대수', format: null }]
                  },
                  enabled: true
                }
              }
            },
            mapState: {
              bearing: 0,
              dragRotate: false,
              latitude: 36.5,
              longitude: 127.5,
              pitch: 0,
              zoom: 6,
              isSplit: false
            }
          }
        };

        dispatch(
          addDataToMap({
            datasets,
            options: {
              centerMap: false,
              readOnly: false
            },
            config: config as any
          })
        );

        setDataLoaded(true);

      } catch (e: any) {
        console.error("Error loading map data:", e);
        // 오류가 발생해도 로딩 화면을 없애고 에러를 콘솔에 기록합니다.
        setDataLoaded(true);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [isReady, partitionsReady, center, camp, device, dateType, selectedDate, queryTrigger, dispatch, query]);

  return (
    <div style={{ height: 'calc(100vh - 80px)', width: '100%', position: 'relative' }}>
      {!dataLoaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="text-slate-700 font-bold text-xl">맵 데이터 로딩 중...</div>
        </div>
      )}
      <KeplerGl
        id="geomap"
        mapboxApiAccessToken={MAPBOX_TOKEN}
        width={window.innerWidth}
        height={window.innerHeight - 80}
      />
    </div>
  );
}
