# GBike Build Dashboard

지바이크(GBike) 전사 대시보드 구축 프로젝트입니다. 로컬 환경에서 대규모 파티션 데이터를 활용해 실시간 수준의 빠른 집계와 시각화를 제공하는 서버리스(Serverless) 아키텍처를 채택했습니다.

## 🚀 시스템 아키텍처 (System Architecture)

본 프로젝트는 별도의 무거운 백엔드 API 서버 없이, 프론트엔드 내에서 쿼리 엔진을 구동하여 데이터를 직접 분석하는 구조입니다.

1. **데이터 추출 및 저장 (Data Pipeline)**
   - Python 배치 스크립트(`utils/dashboard_etl.py`)가 정기적으로 운영 DB(MySQL)에서 데이터를 추출합니다.
   - 추출된 데이터는 컬럼형 포맷인 **Parquet** 파일로 변환되어 프론트엔드의 `public/data` 디렉토리에 월별/주별 등 파티셔닝되어 저장됩니다.
2. **웹 대시보드 서빙 (Frontend Web App)**
   - **DuckDB-WASM**을 활용하여 사용자의 브라우저 위에서 Parquet 파일을 직접 마운트하고 SQL 쿼리를 실행합니다.
   - 데이터 집계 연산이 사용자 디바이스(클라이언트)에서 이루어지므로 서버 유지 비용이 없으며, 수십~수백 메가바이트의 데이터도 밀리초(ms) 단위로 고속 처리됩니다.

## 🛠 기술 스택 (Tech Stack)

### Data Pipeline
- **Language**: Python
- **Libraries**: `pandas`, `pyarrow`, `PyMySQL`
- **Output Format**: Parquet

### Frontend Dashboard
- **Framework**: React 18, TypeScript, Vite
- **Data Engine**: DuckDB-WASM (WebAssembly 기반 인메모리 OLAP DB)
- **Styling**: Tailwind CSS, Vanilla CSS
- **Visualization**: Recharts
- **Icons**: Lucide-React

## 📊 대시보드 핵심 지표 및 산식 (Metrics & Formulas)

대시보드에서 산출되는 모든 지표는 다음의 지바이크 비즈니스 규칙과 공식을 따릅니다.

- **할당대수 (Allocated Units)**: Camp/Small Area에 할당된 전체 자산 수
- **대당매출 (Revenue per Asset)**: `총매출 / 총 할당대수`
- **대당회전수 (Trips per Asset)**: `총 운행수 / 총 할당대수`
- **대당 작업량 (Task per Asset)**: `주간(또는 월간) 총 작업량(재배치+배터리) / 기간 내 일 평균 할당대수`
- **대당 재배치 (Realloc per Asset)**: `재배치 건수 / 기간 내 일 평균 할당대수`
- **대당 배터리 교체 (Battery per Asset)**: `배터리 교체 건수 / 기간 내 일 평균 할당대수`
- **72시간 미사용률 (Unused Rate 72h)**: `72시간 미사용 등록 대수 / 전체 등록 대수`
- **24시간 내 출루율 (Dispatch Rate)**: `배치 후 24시간 내 첫 주행이 발생한 대수 / 전체 배치 대수`
- **캠프 소속 배치존 활성화 비율**: `1대 이상 기기가 배치된 배치존 수 / 캠프 소속 전체 배치존 수`

## ✨ 주요 기능 및 최근 적용 내역

- **동적 기기 필터 연동**: 전체 / 자전거 / 킥보드 등 기기 구분에 따른 데이터를 동적으로 필터링 (한글/영문 매핑 자동 처리).
- **과거 4주치 주차별(Weekly) 차트 렌더링**: 대당 작업량, 대당 재배치, 배터리 교체, 미사용률 차트 등 주요 지표를 선택된 날짜 기준 과거 4개 주(Week) 단위로 자동 묶어 스파크라인 형태로 시각화.
- **비교군 수치(센터 평균, 전사 평균) 제공**: 각 카드의 우측 상단이나 하단에 현재 캠프 수치와 대비되는 상위 조직(센터, 전사)의 실제 평균값을 직관적으로 노출.
- **이중 축(Dual Axis) 차트**: 일별 대당회전수와 대당매출을 동시에 비교할 수 있는 이중 축 꺾은선 차트 적용.
- **블러 처리된 로딩 UI**: DuckDB 엔진 초기화 및 초기 데이터 로딩 시 백그라운드를 블러 처리하고, 애니메이션이 포함된 세련된 "데이터 로딩 중..." 모달 노출.

## 🏃‍♂️ 실행 방법 (Run Locally)

```bash
# 1. 패키지 설치
cd frontend
npm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 운영 환경 빌드 및 프리뷰
npm run build
npm run preview
```

## 🌐 외부 배포 가이드 (Cloudflare Tunnel)

도메인 구매 여부에 따라 두 가지 방식으로 외부 접속 링크를 생성할 수 있습니다.

### 방법 A. 도메인 없이 즉시 임시 링크 발급 (Quick Tunnel)
아직 도메인을 구매하지 않았거나, 회의 시 잠깐만 공유할 때 사용하는 가장 쉬운 방법입니다. **단, 터미널을 끄거나 재시작하면 링크 주소가 변경됩니다.**

1. `cloudflared` CLI 설치 (`npm install -g cloudflared`)
2. 로컬 서버 실행 (`npx serve -s dist -p 3000` 등)
3. 새 터미널을 열고 아래 명령어 실행
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
4. 터미널 출력 로그 중 `https://xxxx.trycloudflare.com` 형태의 링크를 복사하여 공유합니다. (이 터미널 창을 켜두는 동안에만 해당 링크가 유지됩니다.)

---

### 방법 B. 나만의 고정 링크 설정 (Cloudflare Zero Trust)

내부 관계자들에게 안전하게 공유할 수 있는 외부 고정 링크는 Cloudflare Zero Trust (Tunnel)를 이용해 설정할 수 있습니다. 

### 사전 준비
- Cloudflare 계정 및 등록된 도메인
- `cloudflared` CLI 설치 (`npm install -g cloudflared`)

### 설정 순서
1. **Cloudflare 로그인 인증**
   ```bash
   cloudflared tunnel login
   ```
   (브라우저가 열리면 사용할 도메인이 속한 계정을 선택합니다.)

2. **터널 생성**
   ```bash
   cloudflared tunnel create gems-dashboard
   ```
   (생성 완료 시 UUID 형태의 터널 ID가 발급됩니다.)

3. **도메인 DNS 라우팅 등록**
   ```bash
   cloudflared tunnel route dns gems-dashboard dashboard.yourdomain.com
   ```
   (Cloudflare DNS에 자동으로 CNAME 레코드가 등록됩니다.)

4. **설정 파일(config.yml) 작성**
   `~/.cloudflared/config.yml` 파일을 생성하고 아래 내용을 작성합니다:
   ```yaml
   tunnel: <발급받은 터널 UUID>
   credentials-file: /Users/현재PC계정명/.cloudflared/<발급받은 터널 UUID>.json

   ingress:
     - hostname: dashboard.yourdomain.com
       service: http://localhost:3000
     - service: http_status:404
   ```

5. **로컬 프로덕션 서버 실행 (터미널 1)**
   ```bash
   cd frontend
   npm run build
   npx serve -s dist -p 3000
   ```

6. **터널 실행 (터미널 2)**
   ```bash
   cloudflared tunnel run gems-dashboard
   ```

이제 브라우저에서 설정한 도메인(`https://dashboard.yourdomain.com`)으로 접속하면 외부에서도 안전하게 로컬 대시보드 환경에 접근할 수 있습니다. 로컬 PC가 켜져 있고 위 두 프로세스(serve, cloudflared)가 돌아가는 동안에는 고정 링크로 유지됩니다.
