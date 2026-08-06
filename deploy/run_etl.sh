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

echo "[$(date)] Copying data to dist..."
# 빌드된 dist 폴더에서 데이터를 바로 읽을 수 있도록 public/data 데이터를 복사
cp -r "$PROJECT_ROOT/frontend/public/data/"* "$PROJECT_ROOT/frontend/dist/data/"

echo "[$(date)] Pushing updated data to GitHub..."
cd "$PROJECT_ROOT" || exit 1
git add frontend/public/data/*.parquet
git commit -m "Auto-update dashboard data" || echo "No changes to commit"
git push origin main

echo "[$(date)] ETL Process Completed."
