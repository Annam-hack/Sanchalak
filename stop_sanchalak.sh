#!/bin/bash

# Get the directory of this script, regardless of where it's called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

print_status() {
    echo -e "$1"
}

# Function to kill process on a port
kill_port() {
    PORT=$1
    PID=$(lsof -ti:$PORT)
    if [ ! -z "$PID" ]; then
        print_status "🛑 Killing process on port $PORT (PID: $PID)..."
        kill -9 $PID 2>/dev/null || true
    else
        print_status "✅ No process found on port $PORT."
    fi
}

print_status "🛑 Stopping all Sanchalak services..."

# Kill all relevant ports
kill_port 8001  # EFR Server
kill_port 8002  # Scheme Server
kill_port 8003  # Schemabot GraphQL
kill_port 3001  # New UI Backend
kill_port 3000  # New UI Frontend

print_status "✅ All services stopped." 