#!/bin/bash
# ---------------------------------------------------------
# 로컬 서버(Mac)용 launchd 서비스 등록 스크립트
# 이 스크립트를 서버용 Mac에서 실행하세요.
# ---------------------------------------------------------

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"
PLIST_DIR="$HOME/Library/LaunchAgents"

mkdir -p "$PLIST_DIR"
mkdir -p "$PROJECT_ROOT/logs"

# 스크립트 실행 권한 부여
chmod +x "$DIR/run_etl.sh"
chmod +x "$DIR/run_web.sh"

echo "==== 1. 웹 서버(Frontend) launchd 설정 중 ===="
WEB_PLIST_PATH="$PLIST_DIR/com.gbike.dashboard.web.plist"
cat > "$WEB_PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.gbike.dashboard.web</string>
    <key>ProgramArguments</key>
    <array>
        <string>$DIR/run_web.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PROJECT_ROOT/logs/web_out.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_ROOT/logs/web_err.log</string>
</dict>
</plist>
EOF

echo "==== 2. ETL 파이프라인(Python) launchd 설정 중 ===="
ETL_PLIST_PATH="$PLIST_DIR/com.gbike.dashboard.etl.plist"
cat > "$ETL_PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.gbike.dashboard.etl</string>
    <key>ProgramArguments</key>
    <array>
        <string>$DIR/run_etl.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>3600</integer> <!-- 매 1시간(3600초)마다 자동 실행 -->
    <key>StandardOutPath</key>
    <string>$PROJECT_ROOT/logs/etl_out.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_ROOT/logs/etl_err.log</string>
</dict>
</plist>
EOF

echo "==== 3. 서비스 로드 및 시작 ===="
# 기존 로드된 서비스가 있다면 unload 후 다시 load
launchctl unload "$WEB_PLIST_PATH" 2>/dev/null
launchctl load "$WEB_PLIST_PATH"

launchctl unload "$ETL_PLIST_PATH" 2>/dev/null
launchctl load "$ETL_PLIST_PATH"

echo "완료되었습니다! 웹 서버와 파이프라인이 백그라운드에서 구동됩니다."
echo "웹 서버 접속 주소 확인: cat $PROJECT_ROOT/logs/web_out.log"
