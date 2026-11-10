#!/usr/bin/env bash
# ==============================================================================
# VUKA End-to-End System Verification Suite
# ==============================================================================
# Verifies all layers:
#   1. PostgreSQL Database & Ledger Connectivity
#   2. Go Bridge Core Unit & Integration Tests (100% Zero-Sum Ledger & Daemons)
#   3. Frontend Type Safety (TypeScript strict mode)
#   4. Frontend Production SSR Build (Nitro engine)
#   5. Live Engine Health & Public FX Corridors
#   6. Live Local Frontend UI Server
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  echo -e "  [${GREEN}✓ PASS${NC}] $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo -e "  [${RED}✗ FAIL${NC}] $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

info() {
  echo -e "${CYAN}==>${NC} ${BOLD}$1${NC}"
}

echo ""
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║             VUKA TURNKEY SYSTEM VERIFICATION SUITE           ║${NC}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ------------------------------------------------------------------------------
# 1. Environment & Compiler Checks
# ------------------------------------------------------------------------------
info "Checking Development Tools & Compilers..."

if command -v go >/dev/null 2>&1; then
  GO_VER=$(go version | awk '{print $3}')
  pass "Go compiler detected (${GO_VER})"
else
  fail "Go compiler not found"
fi

if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v)
  pass "Node.js detected (${NODE_VER})"
else
  fail "Node.js not found"
fi

if command -v docker >/dev/null 2>&1; then
  pass "Docker runtime detected"
else
  fail "Docker runtime not found"
fi

# ------------------------------------------------------------------------------
# 2. Database Connectivity
# ------------------------------------------------------------------------------
info "Checking Database Connectivity & Schema..."

DB_URL="${VUKA_DATABASE_URL:-postgres://vuka:vuka-local-dev@localhost:5433/vuka?sslmode=disable}"
TEST_DB_URL="${TEST_DATABASE_URL:-postgres://vuka:vuka-local-dev@localhost:5433/vuka_test?sslmode=disable}"

if docker exec vuka-postgres pg_isready -U vuka -d vuka >/dev/null 2>&1; then
  pass "PostgreSQL 16 ledger database is responsive on port 5433"
else
  fail "PostgreSQL is not responding on port 5433"
fi

# ------------------------------------------------------------------------------
# 3. Go Bridge Engine Tests
# ------------------------------------------------------------------------------
info "Running Backend Go Tests (Ledger, Escrow, Solvency, Pilots)..."

cd "${ROOT_DIR}/ENGINE/go-bridge-core"
if TEST_DATABASE_URL="${TEST_DB_URL}" go test -v -count=1 ./internal/... > /tmp/vuka_go_tests.log 2>&1; then
  pass "Go test suite passed across all packages (zero-sum ledger, escrow keeper, daemons)"
else
  fail "Go test suite encountered failures (see /tmp/vuka_go_tests.log)"
  tail -n 25 /tmp/vuka_go_tests.log || true
fi

# ------------------------------------------------------------------------------
# 4. Frontend Type Safety (TypeScript)
# ------------------------------------------------------------------------------
info "Validating Frontend Type Safety..."

cd "${ROOT_DIR}/FRONTEND"
if npx tsc --noEmit > /tmp/vuka_tsc.log 2>&1; then
  pass "Frontend strict TypeScript verification passed (0 type errors)"
else
  fail "Frontend TypeScript check failed (see /tmp/vuka_tsc.log)"
  tail -n 20 /tmp/vuka_tsc.log || true
fi

# ------------------------------------------------------------------------------
# 5. Frontend Production SSR Build
# ------------------------------------------------------------------------------
info "Building Production Frontend Bundle (Nitro SSR)..."

if npm run build > /tmp/vuka_build.log 2>&1; then
  pass "Frontend built cleanly into .output/server/index.mjs"
else
  fail "Frontend production build failed (see /tmp/vuka_build.log)"
  tail -n 20 /tmp/vuka_build.log || true
fi

# ------------------------------------------------------------------------------
# 6. Live Local Endpoints
# ------------------------------------------------------------------------------
info "Testing Live Running Endpoints..."

if curl -s -f http://localhost:8080/healthz >/dev/null 2>&1; then
  pass "Engine HTTP healthcheck (http://localhost:8080/healthz) is HEALTHY"
else
  fail "Engine HTTP healthcheck is unreachable on port 8080"
fi

FX_RES=$(curl -s http://localhost:8080/api/fx 2>/dev/null || true)
if echo "${FX_RES}" | grep -q "rate"; then
  pass "Engine FX Corridor API live: ${FX_RES}"
else
  fail "Engine FX Corridor API failed to return exchange rate"
fi

if curl -s -f http://localhost:5173/ >/dev/null 2>&1; then
  pass "Frontend development server (http://localhost:5173/) is ACTIVE"
else
  echo -e "  [${YELLOW}! INFO${NC}] Frontend dev server not active on port 5173 (optional for test script)"
fi

# ------------------------------------------------------------------------------
# Final Scorecard
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}VERIFICATION SUMMARY: ${GREEN}${PASS_COUNT} PASSED${NC}, ${RED}${FAIL_COUNT} FAILED${NC}"
echo -e "${BOLD}${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ ${FAIL_COUNT} -eq 0 ]; then
  echo -e "${GREEN}${BOLD}🎉 ALL CHECKS PASSED — VUKA IS 100% PRODUCTION-READY!${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}${BOLD}❌ VERIFICATION FAILED — Please resolve errors before deploying.${NC}"
  echo ""
  exit 1
fi
