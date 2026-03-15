#!/usr/bin/env bash
# setup.sh – Quick setup script for Unitree G1 EDU Controller
# Usage: bash setup.sh [--build]

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()    { echo -e "${GREEN}[setup]${NC} $*"; }
warn()   { echo -e "${YELLOW}[setup]${NC} $*"; }
error()  { echo -e "${RED}[setup]${NC} $*" >&2; exit 1; }

BUILD=false
for arg in "$@"; do
  [[ "$arg" == "--build" ]] && BUILD=true
done

# ── 1. Node.js version check ──────────────────────────────────────────────────
REQUIRED_NODE=20
if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Please install Node.js $REQUIRED_NODE or newer."
fi

NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if (( NODE_VER < REQUIRED_NODE )); then
  error "Node.js $NODE_VER detected, but $REQUIRED_NODE+ is required. Please upgrade."
fi
log "Node.js $NODE_VER detected ✓"

# ── 2. npm availability check ─────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
  error "npm is not found. Please make sure npm is installed alongside Node.js."
fi
log "npm $(npm --version) detected ✓"

# ── 3. Copy .env if missing ───────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    warn ".env file created from .env.example – review and adjust values as needed."
  else
    warn ".env.example not found, skipping .env creation."
  fi
else
  log ".env already exists ✓"
fi

# ── 4. Install dependencies ───────────────────────────────────────────────────
log "Installing npm dependencies..."
if [[ ! -f package-lock.json ]]; then
  warn "package-lock.json not found – running 'npm install' to generate it."
  npm install || error "Dependency installation failed. Check npm output above."
else
  npm ci || error "Dependency installation failed. If lock-file is out of sync, run 'npm install' manually."
fi
log "Dependencies installed ✓"

# ── 5. Optional production build ─────────────────────────────────────────────
if [[ "$BUILD" == "true" ]]; then
  log "Running production build..."
  npm run build
  log "Build complete – output in dist/ ✓"
fi

# ── 6. Done ───────────────────────────────────────────────────────────────────
echo ""
log "Setup complete! 🎉"
echo ""
echo "  To start the dev server:        npm run dev"
echo "  To create a production build:   npm run build"
echo "  To preview the production build: npm run preview"
echo ""
warn "Before connecting to a real robot, read the safety notes in README.md."
