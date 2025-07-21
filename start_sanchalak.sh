#!/bin/bash

# Get the directory of this script, regardless of where it's called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Helper function for status messages
print_status() {
    echo -e "$1"
}

# Function to check and cd into a directory, or fail gracefully
safe_cd() {
    if [ -d "$1" ]; then
        cd "$1"
    else
        echo "❌ Directory not found: $1"
        exit 1
    fi
}

# Start EFR Server
print_status "1️⃣  Starting EFR Server (Port 8001)..."
safe_cd "$PROJECT_ROOT/src/efr_server"
uvicorn main:app --host 0.0.0.0 --port 8001 > "$PROJECT_ROOT/logs/efr_server.log" 2>&1 &
EFR_PID=$!
cd "$PROJECT_ROOT"

# Start Scheme Server
print_status "2️⃣  Starting Scheme Server (Port 8002)..."
safe_cd "$PROJECT_ROOT/src/scheme_server"
uvicorn scheme_backend:app --host 0.0.0.0 --port 8002 > "$PROJECT_ROOT/logs/scheme_server.log" 2>&1 &
SCHEME_PID=$!
cd "$PROJECT_ROOT"

# Start Schemabot GraphQL Server
print_status "3️⃣  Starting Schemabot GraphQL Server (Port 8003)..."
safe_cd "$PROJECT_ROOT/src/schemabot/api"
python graphql_server.py > "$PROJECT_ROOT/logs/schemabot_graphql.log" 2>&1 &
SCHEMABOT_PID=$!
cd "$PROJECT_ROOT"

# Start New UI Backend
print_status "4️⃣  Starting New UI Backend (Port 3001)..."
safe_cd "$PROJECT_ROOT/src/app/new_ui/backend"
if [ ! -d "node_modules" ]; then
    print_status "📦 Installing new UI backend dependencies..."
    npm install > "$PROJECT_ROOT/logs/new_ui_backend_install.log" 2>&1
fi
npm run dev > "$PROJECT_ROOT/logs/new_ui_backend.log" 2>&1 &
NEW_UI_BACKEND_PID=$!
cd "$PROJECT_ROOT"

# Start New UI Frontend
print_status "5️⃣  Starting New UI Frontend (Port 3000)..."
safe_cd "$PROJECT_ROOT/src/app/new_ui"
if [ ! -d "node_modules" ]; then
    print_status "📦 Installing new UI frontend dependencies..."
    npm install > "$PROJECT_ROOT/logs/new_ui_frontend_install.log" 2>&1
fi
npm run dev > "$PROJECT_ROOT/logs/new_ui_frontend.log" 2>&1 &
NEW_UI_FRONTEND_PID=$!
cd "$PROJECT_ROOT"

print_status "\n🎉 All services started!\n"
print_status "🌐 Service Endpoints:"
print_status "   - New UI Frontend:     http://localhost:3000"
print_status "   - New UI Backend:      http://localhost:3001"
print_status "   - EFR Server:          http://localhost:8001"
print_status "   - Scheme Server:       http://localhost:8002"
print_status "   - Schemabot GraphQL:   http://localhost:8003"
print_status "\n📁 Log Files:"
print_status "   - logs/efr_server.log"
print_status "   - logs/scheme_server.log"
print_status "   - logs/schemabot_graphql.log"
print_status "   - logs/new_ui_backend.log"
print_status "   - logs/new_ui_frontend.log"
print_status "\n💡 Press Ctrl+C to stop all services."

# Keep the script running
wait 