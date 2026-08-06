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
git commit -am "Auto-update dashboard metadata/scripts and data" || echo "No changes to commit"

# 크론(Cron) 등 백그라운드 환경에서 SSH 비밀번호 대기(Hang) 현상을 방지하기 위해
# 이미 인증된 GitHub CLI(gh)의 토큰을 가져와 HTTPS 방식으로 푸시합니다.
if command -v gh &> /dev/null; then
    git -c credential.helper= -c credential.helper='!gh auth git-credential' push https://github.com/deepdawn/gems_build_dashboard.git main
else
    git push origin main
fi

echo "[$(date)] ETL Process Completed."
