#!/bin/bash
# ---------------------------------------------------------
# 대시보드 웹 서버 (미리보기) 자동 실행 스크립트
# ---------------------------------------------------------

# 이 스크립트가 위치한 deploy 폴더의 상위 폴더(루트)로 이동
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"

# PATH에 Homebrew 경로 추가 (launchd 환경 오류 방지)
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH

cd "$PROJECT_ROOT/frontend" || exit 1

echo "[$(date)] Building Dashboard Web..."
npm run build

echo "[$(date)] Starting Nginx Server..."
# launchd에서 관리 가능하도록 데몬 모드 끄고 포그라운드 실행
exec /opt/homebrew/opt/nginx/bin/nginx -g 'daemon off;'
