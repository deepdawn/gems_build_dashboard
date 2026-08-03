#!/bin/bash
# ---------------------------------------------------------
# 대시보드 ETL 파이프라인 자동 실행 스크립트
# ---------------------------------------------------------

# 이 스크립트가 위치한 deploy 폴더의 상위 폴더(루트)로 이동
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"

cd "$PROJECT_ROOT/utils" || exit 1

echo "[$(date)] Starting ETL Process..."
# 시스템에 설치된 python3를 사용하여 실행 (가상환경이 있다면 경로 수정 필요)
/usr/bin/env python3 dashboard_etl.py
echo "[$(date)] ETL Process Completed."
