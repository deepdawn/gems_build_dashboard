import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
// @ts-ignore
import KeplerGl from '@kepler.gl/components';
// @ts-ignore
import { addDataToMap, updateMap, fitBounds, removeDataset } from '@kepler.gl/actions';
import { useDuckDB } from '../../hooks/useDuckDB';
import { useFilters } from '../../context/FilterContext';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export function KeplerMapPage() {
  const dispatch = useDispatch();
  const { isReady, query } = useDuckDB();
  const { center, camp, dateType, selectedDate, device, queryTrigger, partitionsReady, setLoadingState } = useFilters();
  const [dataLoaded, setDataLoaded] = useState(false);

  // 최초 마운트 시 한국 좌표로 맵 상태를 설정합니다.
  useEffect(() => {
    dispatch(
      updateMap({
        latitude: 36.5,
        longitude: 127.5,
        zoom: 6,
        bearing: 0,
        pitch: 0,
        dragRotate: false,
      })
    );
  }, [dispatch]);

  useEffect(() => {
    if (!isReady || !partitionsReady || !camp) return;

    let cancelled = false;

    const loadData = async () => {
      setLoadingState(prev => ({ ...prev, map: true }));
      try {
        setDataLoaded(false);

        // === 날짜 조건 생성 ===
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

        // === 필터 조건 생성 ===
        const centerCondOrders = center === '전체' ? '' : `AND high_region_name LIKE '%${center}%'`;
        const campCondOrders = camp === '전체' ? '' : `AND middle_region_name = '${camp}'`;
        
        let deviceCondOrders = '';
        if (device === '자전거') deviceCondOrders = `AND 기기구분 IN ('자전거', 'bicycle')`;
        if (device === '킥보드') deviceCondOrders = `AND 기기구분 IN ('킥보드', 'scooter')`;

        // === 1. 운행 데이터 쿼리 ===
        const ordersQuery = `
          SELECT 
            start_lng as start_lat, start_lat as start_lng, 
            end_lng as end_lat, end_lat as end_lng, 
            기기구분
          FROM orders
          WHERE 1=1
            ${centerCondOrders}
            ${campCondOrders}
            ${deviceCondOrders}
            AND ${dateCondition}
            AND start_lat IS NOT NULL AND start_lng IS NOT NULL
            AND end_lat IS NOT NULL AND end_lng IS NOT NULL
        `;

        console.log('[GeoMap] Orders Query:', ordersQuery);
        const ordersRes = await query(ordersQuery);
        console.log(`[GeoMap] Orders result: ${ordersRes.length} rows`);
        if (ordersRes.length > 0) {
          console.log('[GeoMap] Orders sample:', ordersRes[0]);
        }

        // === 2. 배치존 데이터 쿼리 ===
        const centerCondSpots = center === '전체' ? '' : `AND high_region_name LIKE '%${center}%'`;
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

        console.log('[GeoMap] Spots Query:', spotsQuery);
        const spotsRes = await query(spotsQuery);
        console.log(`[GeoMap] Spots result: ${spotsRes.length} rows`);

        if (cancelled) return;

        // === Kepler.gl에 데이터 전달 (config 없이, 자동 레이어 생성) ===
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
              rows: ordersRes.map((r: any) => [r.start_lat, r.start_lng, r.end_lat, r.end_lng, r.기기구분])
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
              rows: spotsRes.map((r: any) => [r.lat, r.lng, r.배치존명, r.설정대수])
            }
          }
        ];

        console.log(`[GeoMap] Dispatching addDataToMap with ${ordersRes.length} orders, ${spotsRes.length} spots`);

        // 기존 데이터셋을 제거하여 Kepler.gl이 데이터를 캐싱/병합하지 않고 새로 그리도록 강제합니다.
        dispatch(removeDataset('orders_data'));
        dispatch(removeDataset('spots_data'));

        const keplerConfig = {
          version: 'v1',
          config: {
            visState: {
              filters: [],
              layers: [
                {
                  id: 'spots_layer',
                  type: 'point',
                  config: {
                    dataId: 'spots_data',
                    label: '현재 배치존 (Deploy Spots)',
                    color: [57, 255, 20],
                    columns: { lat: 'lat', lng: 'lng', altitude: null },
                    isVisible: true,
                    visConfig: {
                      radius: 10,
                      fixedRadius: false,
                      opacity: 0.8,
                      outline: false,
                      thickness: 2,
                      strokeColor: null,
                      colorRange: { name: 'Custom Palette', type: 'custom', category: 'Custom', colors: ['#39ff14'] },
                      strokeColorRange: { name: 'Global Warming', type: 'sequential', category: 'Uber', colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300'] },
                      radiusRange: [0, 50],
                      filled: true
                    },
                    hidden: false,
                    textLabel: [{ field: null, color: [255, 255, 255], size: 18, offset: [0, 0], anchor: 'start', alignment: 'center' }]
                  },
                  visualChannels: {
                    colorField: null, colorScale: 'quantile', sizeField: null, sizeScale: 'linear', strokeColorField: null, strokeColorScale: 'quantile'
                  }
                },
                {
                  id: 'start_layer',
                  type: 'heatmap',
                  config: {
                    dataId: 'orders_data',
                    label: 'start',
                    color: [255, 0, 0],
                    columns: { lat: 'start_lat', lng: 'start_lng' },
                    isVisible: true,
                    visConfig: {
                      opacity: 0.8,
                      colorRange: {
                        name: 'Custom Red', type: 'sequential', category: 'Custom',
                        colors: ['#ffffff', '#ffdfdf', '#ffb3b3', '#ff6666', '#cc0000', '#800000']
                      },
                      radius: 20,
                      intensity: 0.1,
                      threshold: 0.6
                    },
                    hidden: false,
                    textLabel: []
                  },
                  visualChannels: { weightField: null, weightScale: 'linear' }
                },
                {
                  id: 'end_layer',
                  type: 'heatmap',
                  config: {
                    dataId: 'orders_data',
                    label: 'end',
                    color: [0, 0, 255],
                    columns: { lat: 'end_lat', lng: 'end_lng' },
                    isVisible: true,
                    visConfig: {
                      opacity: 0.8,
                      colorRange: {
                        name: 'Custom Blue', type: 'sequential', category: 'Custom',
                        colors: ['#ffffff', '#dfdfff', '#b3b3ff', '#6666ff', '#0000cc', '#000080']
                      },
                      radius: 20,
                      intensity: 0.1,
                      threshold: 0.6
                    },
                    hidden: false,
                    textLabel: []
                  },
                  visualChannels: { weightField: null, weightScale: 'linear' }
                }
              ],
              interactionConfig: {
                tooltip: {
                  fieldsToShow: {
                    spots_data: [{ name: '배치존명', format: null }, { name: '설정대수', format: null }],
                    orders_data: [{ name: '기기구분', format: null }]
                  },
                  compareMode: false, compareType: 'absolute', enabled: true
                },
                brush: { size: 0.5, enabled: false },
                geocoder: { enabled: false },
                coordinate: { enabled: false }
              },
              layerBlending: 'additive',
              layerOrder: ['spots_layer', 'start_layer', 'end_layer'],
              splitMaps: [],
              animationConfig: { currentTime: null, speed: 1 }
            },
            mapState: { bearing: 0, dragRotate: false, latitude: 36.5, longitude: 127.5, pitch: 0, zoom: 6, isSplit: false },
            mapStyle: {
              styleType: 'dark',
              topLayerGroups: {},
              visibleLayerGroups: { label: true, road: true, border: false, building: true, water: true, land: true, '3d building': false },
              threeDBuildingColor: [9.665468314072013, 17.18305478057247, 31.1442867897876],
              mapStyles: {}
            }
          }
        };

        dispatch(
          addDataToMap({
            datasets,
            options: {
              centerMap: false,
              readOnly: false,
              keepExistingConfig: false
            },
            config: keplerConfig as any
          })
        );

        // Calculate bounding box to auto-zoom to the selected region
        if (spotsRes.length > 0 || ordersRes.length > 0) {
          let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
          
          spotsRes.forEach((r: any) => {
            if (r.lat < minLat) minLat = r.lat;
            if (r.lat > maxLat) maxLat = r.lat;
            if (r.lng < minLng) minLng = r.lng;
            if (r.lng > maxLng) maxLng = r.lng;
          });
          
          ordersRes.forEach((r: any) => {
            // Use the aliased start_lat/start_lng from ordersRes
            if (r.start_lat < minLat) minLat = r.start_lat;
            if (r.start_lat > maxLat) maxLat = r.start_lat;
            if (r.start_lng < minLng) minLng = r.start_lng;
            if (r.start_lng > maxLng) maxLng = r.start_lng;
          });

          // Default bounds if calculation failed
          if (minLat === 90) {
            minLat = 33.0; maxLat = 38.5; minLng = 125.0; maxLng = 130.0;
          }

          // Add a small padding to bounds
          const latPadding = (maxLat - minLat) * 0.1 || 0.01;
          const lngPadding = (maxLng - minLng) * 0.1 || 0.01;

          // Dispatch fitBounds to automatically zoom into the selected center/camp
          setTimeout(() => {
            dispatch(
              fitBounds([
                minLng - lngPadding, 
                minLat - latPadding, 
                maxLng + lngPadding, 
                maxLat + latPadding
              ])
            );
          }, 500);
        } else {
          // Fallback to Korea center if no data
          setTimeout(() => {
            dispatch(
              updateMap({
                latitude: 36.5,
                longitude: 127.5,
                zoom: 6,
              })
            );
          }, 500);
        }

        setDataLoaded(true);

      } catch (e: any) {
        console.error("[GeoMap] Error loading map data:", e);
        setDataLoaded(true);
      } finally {
        if (!cancelled) {
          setLoadingState(prev => ({ ...prev, map: false }));
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
      setLoadingState(prev => ({ ...prev, map: false }));
    };
  }, [isReady, partitionsReady, center, camp, dateType, selectedDate, device, queryTrigger, dispatch, query]);

  return (
    <div style={{ height: 'calc(100vh - 80px)', width: '100%', position: 'relative' }}>
      {/* 범례 (Legend) 박스 추가 */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        gap: '24px',
        fontWeight: 'bold',
        fontSize: '14px',
        color: '#334155',
        border: '1px solid #e2e8f0',
        pointerEvents: 'none' // 클릭 이벤트가 지도로 통과되도록
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔴</span> 출발지 (Start)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔵</span> 도착지 (End)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🟢</span> 현재 배치존
        </div>
      </div>

      {!dataLoaded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{ color: '#334155', fontWeight: 'bold', fontSize: '1.25rem' }}>맵 데이터 로딩 중...</div>
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
