#!/bin/bash
# Hollywood Clinic - Local development server

echo ""
echo "============================================================"
echo "             Hollywood Clinic - Local Server"
echo "============================================================"
echo ""

# Try Python 3 (most likely to be installed)
if command -v python3 >/dev/null 2>&1; then
    echo "[OK] Python 3 detected"
    echo ""
    echo "Starting server at http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop."
    echo ""
    sleep 1
    # Open browser on Mac or Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        (sleep 1 && open "http://localhost:8000") &
    elif command -v xdg-open >/dev/null 2>&1; then
        (sleep 1 && xdg-open "http://localhost:8000") &
    fi
    python3 -m http.server 8000
    exit 0
fi

# Try Node.js as fallback
if command -v npx >/dev/null 2>&1; then
    echo "[OK] Node.js detected"
    echo ""
    echo "Starting server at http://localhost:3000"
    echo ""
    npx serve -p 3000 .
    exit 0
fi

# Try PHP as last resort
if command -v php >/dev/null 2>&1; then
    echo "[OK] PHP detected"
    echo ""
    php -S localhost:8000
    exit 0
fi

echo "[ERROR] No server tool detected."
echo ""
echo "Install Python 3 (easiest): https://www.python.org/downloads/"
echo "Or Node.js:                  https://nodejs.org/"
echo ""
exit 1
