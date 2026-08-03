#!/bin/bash
# ---------------------------------------------------------
# 대시보드 ETL 파이프라인 자동 실행 스크립트
# ---------------------------------------------------------

# 이 스크립트가 위치한 deploy 폴더의 상위 폴더(루트)로 이동
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"

cd "$PROJECT_ROOT/utils" || exit 1

echo "[$(date)] Starting ETL Process..."
# 가상환경(venv)에 설치된 python을 사용하여 실행
"$PROJECT_ROOT/.venv/bin/python" dashboard_etl.py
echo "[$(date)] ETL Process Completed."
