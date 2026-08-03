#!/bin/bash
# ---------------------------------------------------------
# 대시보드 웹 서버 (미리보기) 자동 실행 스크립트
# ---------------------------------------------------------

# 이 스크립트가 위치한 deploy 폴더의 상위 폴더(루트)로 이동
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"

cd "$PROJECT_ROOT/frontend" || exit 1

# 성능과 안정성을 위해 dev 서버 대신 preview 모드로 실행 권장
echo "[$(date)] Starting Dashboard Web Server..."
/usr/bin/env npm run preview -- --host
