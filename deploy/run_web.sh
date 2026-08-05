#!/bin/bash
# ---------------------------------------------------------
# 대시보드 웹 서버 (미리보기) 자동 실행 스크립트
# ---------------------------------------------------------

# 이 스크립트가 위치한 deploy 폴더의 상위 폴더(루트)로 이동
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"

# PATH에 Homebrew 경로 및 npm 글로벌 경로 추가
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH
export PATH=$(npm config get prefix)/bin:$PATH

cd "$PROJECT_ROOT/frontend" || exit 1

echo "[$(date)] Building Dashboard Web..."
npm run build

echo "[$(date)] Starting Web Server on port 3000..."
# 백그라운드에 로컬 웹 서버 실행
npx serve -s dist -p 3000 &
SERVE_PID=$!

echo "[$(date)] Starting Cloudflare Quick Tunnel..."
# Quick Tunnel 실행 (터미널에 임시 URL이 출력됨)
cloudflared tunnel --url http://localhost:3000

# cloudflared가 종료되면 웹 서버 프로세스도 함께 종료
kill $SERVE_PID
