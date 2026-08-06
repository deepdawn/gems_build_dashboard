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

> [!NOTE]
> **터널링 접속 시 로컬호스트보다 느린 이유**
> 백엔드 서버 없이 브라우저에서 대규모 파티션 데이터를 직접 다운로드하고 연산하는(DuckDB-WASM) 아키텍처 특성상, 로컬에서는 SSD를 통해 즉시 로딩되지만 터널링 환경에서는 로컬 PC의 인터넷 '업로드' 속도와 Cloudflare 엣지망을 거치는 네트워크 지연이 발생합니다. 정식 운영 시에는 `dist/` 빌드 결과물과 `public/data/`를 AWS S3나 Vercel 등에 정적 호스팅하면 1초 이내로 쾌적하게 로딩됩니다.

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

---

## ☁️ 클라우드 정적 호스팅 (GCS, AWS S3 등) 배포 가이드

운영 환경(Production)에서 대시보드를 가장 쾌적하고 빠르게 제공하려면 프론트엔드 빌드 결과물(`dist/`)과 파티션 데이터(`public/data/`)를 클라우드 스토리지에 정적 호스팅하는 것을 강력히 권장합니다.

### 💡 핵심 필수 설정 (매우 중요)
DuckDB-WASM 엔진이 대규모 Parquet 파일을 통째로 다운로드하지 않고 **필요한 부분만 쏙쏙 골라 다운로드(HTTP Range Request)** 하도록 만들려면, 사용하시는 클라우드 스토리지(GCS, S3, R2 등) 버킷에 반드시 아래 두 가지 설정이 되어 있어야 합니다.

1. **HTTP Range Request 지원**
   - 대부분의 메이저 클라우드 오브젝트 스토리지는 기본적으로 헤더(`Accept-Ranges: bytes`)를 지원하므로 큰 문제가 없습니다.
2. **CORS (교차 출처 리소스 공유) 규칙 세팅**
   - 프론트엔드 도메인과 스토리지(데이터) 도메인이 다를 경우 브라우저가 보안상 요청을 차단하므로 CORS 규칙을 버킷에 추가해야 합니다.
   - **허용 메소드(Methods)**: `GET`, `HEAD` 필수 (파일 유무 확인 시 HEAD 요청을 사용함)
   - **노출 헤더(Expose Headers)**: `Content-Length`, `Content-Range` 필수 (이 두 헤더가 브라우저에 노출되어야 엔진이 파일 크기를 파악하고 부분 다운로드를 할 수 있습니다.)

**✅ 구글 클라우드 스토리지(GCS) CORS 설정 예시 (cors.json):**
```json
[
  {
    "origin": ["https://dashboard.yourdomain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"],
    "maxAgeSeconds": 3600
  }
]
```
(설정 적용 명령어: `gsutil cors set cors.json gs://your-bucket-name`)

이 세팅만 완료하면, 서버 인프라 유지보수 비용 없이 100% 정적 파일 구조만으로 초고속 엔터프라이즈급 대시보드를 전 세계 어디서든 무제한으로 서비스할 수 있습니다!

---

## ⚡️ Vercel 배포 가이드 (무료/가장 빠름)

Vercel은 정적 파일과 프론트엔드 프레임워크를 글로벌 엣지(Edge) 네트워크에 가장 손쉽게 배포할 수 있는 서비스입니다. 본 프로젝트는 백엔드가 없는 정적 파일 기반이므로 Vercel의 무료 플랜(Hobby)으로도 매우 빠르고 안정적인 서비스가 가능하며, Range Request도 기본적으로 완벽하게 지원합니다.

### 배포 방법
1. 코드를 GitHub 레포지토리에 푸시(Push)합니다.
2. [Vercel 대시보드](https://vercel.com)에 로그인 후 **Add New Project**를 클릭합니다.
3. 해당 GitHub 레포지토리를 **Import** 합니다.
4. 프로젝트 설정(Configure Project) 화면에서 아래와 같이 세팅합니다:
   - **Framework Preset**: `Vite` (자동 감지됨)
   - **Root Directory**: `frontend` (매우 중요! 반드시 `frontend`를 선택해야 합니다.)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Deploy** 버튼을 클릭합니다.

배포가 완료되면 Vercel에서 제공하는 `.vercel.app` 무료 도메인으로 대시보드에 즉시 접속할 수 있으며, 이 주소를 내부 관계자들에게 고정 링크로 공유하시면 됩니다! 데이터가 업데이트될 경우, 로컬에서 추출된 `.parquet` 파일들을 GitHub에 푸시하기만 하면 Vercel이 알아서 다시 빌드하여 최신 데이터를 반영해 줍니다.
