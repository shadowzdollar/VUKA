# ============================================================================
# VUKA Engine Makefile (Phase 1 Go engine + Phase 2 Python ISO gateway)
#
# Targets:
#   make build              compile the Go engine binary
#   make vet                run go vet
#   make test               run the full Go test suite against TEST_DATABASE_URL
#                           (defaults to the local dockerized PG on :5433,
#                            database vuka_test)
#   make test-integration   end-to-end Go: spin up dockerized PG, (re)provision
#                           a clean vuka_test schema, run the suite under
#                           `go test -race`
#   make gateway            build the Python ISO 20022 gateway venv
#   make gateway-test       run pytest against a LIVE Go engine (assumes the
#                           engine is running with gRPC on VUKA_ENGINE_GRPC_ADDR)
#   make up / make down     start / stop dockerized PostgreSQL + Adminer
#   make reconcile-run      start PostgreSQL and the read-only Amoy reconciler
#   make backup             create a local PostgreSQL custom-format backup
#   make restore            restore BACKUP_FILE after explicit confirmation
#   make restore-drill      restore the latest backup into a disposable database
#   make clean              drop the vuka_test database
# ============================================================================

SHELL := /bin/bash
COMPOSE_FILE := deploy/docker-compose.yml
PG_SERVICE := postgres
# host port mapped to container 5432
PG_HOST_PORT := 5433
PG_USER := vuka
# Local dev credential — overridable via env; never a committed secret.
# Set PG_PASSWORD in your shell (or .env) with your local dev password.
PG_PASSWORD ?= changeme
# DB created by the container on start
PG_SUPER_DB := vuka
PG_TEST_DB := vuka_test

# The DSN the Go tests run against. Point here to control the target database.
TEST_DATABASE_URL ?= postgres://$(PG_USER):$(PG_PASSWORD)@localhost:$(PG_HOST_PORT)/$(PG_TEST_DB)?sslmode=disable

MKFILE_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

.PHONY: build vet test test-integration up down clean psql provision backup restore restore-drill reconcile-run

build:
	cd $(MKFILE_DIR)go-bridge-core && go build ./...

vet:
	cd $(MKFILE_DIR)go-bridge-core && go vet ./...

test:
	@set -a; [ ! -f "$(MKFILE_DIR)deploy/.env" ] || . "$(MKFILE_DIR)deploy/.env"; set +a; \
		configured_test_url='$(if $(filter command line environment,$(origin TEST_DATABASE_URL)),$(TEST_DATABASE_URL),)'; \
		test -n "$${TEST_DATABASE_URL:-$$configured_test_url}" || \
		test -n "$${POSTGRES_PASSWORD:-}" || \
		{ echo "ERROR: set TEST_DATABASE_URL or POSTGRES_PASSWORD."; exit 1; }; \
		test_url="$${TEST_DATABASE_URL:-$$configured_test_url}"; \
		if [ -z "$$test_url" ]; then \
			test_password="$${POSTGRES_PASSWORD//\'/\'\'}"; \
			test_url="user=$(PG_USER) password='$$test_password' host=localhost port=$(PG_HOST_PORT) dbname=$(PG_TEST_DB) sslmode=disable"; \
		fi; \
		cd "$(MKFILE_DIR)go-bridge-core" && TEST_DATABASE_URL="$$test_url" go test ./internal/... -count=1

# Deterministic container name for psql/pg_isready/copy targets.
PG_CONTAINER := $(shell docker compose -f $(MKFILE_DIR)$(COMPOSE_FILE) ps -q $(PG_SERVICE) 2>/dev/null | head -n1)

up:
	docker compose -f $(MKFILE_DIR)$(COMPOSE_FILE) up -d

down:
	docker compose -f $(MKFILE_DIR)$(COMPOSE_FILE) down

# (Re)provision a clean vuka_test database from deploy/init.sql inside the
# running postgres container. Idempotent: drops any previous test DB first.
provision:
	@test -n "$(PG_CONTAINER)" || { echo "ERROR: postgres container is not running; run 'make up' first."; exit 1; }
	@echo "Provisioning clean $(PG_TEST_DB) database..."
	@docker exec "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_SUPER_DB) -v ON_ERROR_STOP=1 \
		-c "DROP DATABASE IF EXISTS $(PG_TEST_DB);" \
		-c "CREATE DATABASE $(PG_TEST_DB);"
	docker exec -i "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_TEST_DB) -v ON_ERROR_STOP=1 \
		< $(MKFILE_DIR)deploy/init.sql
	docker exec -i "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_TEST_DB) -v ON_ERROR_STOP=1 \
		< $(MKFILE_DIR)deploy/migrations/003_identity_compliance.sql
	docker exec -i "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_TEST_DB) -v ON_ERROR_STOP=1 \
		< $(MKFILE_DIR)deploy/migrations/004_provider_integration.sql
	docker exec -i "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_TEST_DB) -v ON_ERROR_STOP=1 \
		< $(MKFILE_DIR)deploy/migrations/005_controlled_settlement.sql
	docker exec -i "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_TEST_DB) -v ON_ERROR_STOP=1 \
		< $(MKFILE_DIR)deploy/migrations/006_supervised_pilot.sql
	@echo "Schema applied to $(PG_TEST_DB)."

# Integration harness: bring PG up, wait until healthy, provision, then test.
test-integration: up provision
	@echo "Waiting for PostgreSQL to become healthy..."
	@for i in $$(seq 1 30); do \
		if docker exec "$(PG_CONTAINER)" pg_isready -U $(PG_USER) -d $(PG_SUPER_DB) >/dev/null 2>&1; then \
			echo "PostgreSQL is up."; break; \
		fi; \
		sleep 1; \
	done
	$(MAKE) test

clean: down
	@test -n "$(PG_CONTAINER)" || exit 0
	docker exec "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_SUPER_DB) \
		-c "DROP DATABASE IF EXISTS $(PG_TEST_DB);"

psql:
	@test -n "$(PG_CONTAINER)" || { echo "ERROR: postgres container is not running; run 'make up' first."; exit 1; }
	docker exec -it "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_TEST_DB)

BACKUP_DIR ?= $(MKFILE_DIR)deploy/backups

backup:
	@test -n "$(PG_CONTAINER)" || { echo "ERROR: postgres container is not running; run 'make up' first."; exit 1; }
	@backup_file="$(BACKUP_FILE)"; \
	if [ -z "$$backup_file" ]; then \
		backup_file="$(BACKUP_DIR)/vuka-$$(date -u +%Y%m%dT%H%M%SZ).dump"; \
	fi; \
	mkdir -p "$$(dirname "$$backup_file")"; \
	echo "Creating backup at $$backup_file..."; \
	docker exec "$(PG_CONTAINER)" pg_dump -U $(PG_USER) -d $(PG_SUPER_DB) -Fc > "$$backup_file"; \
	test -s "$$backup_file" || { echo "ERROR: backup file is empty."; exit 1; }; \
	echo "Backup created: $$backup_file"

restore:
	@test "$(CONFIRM_RESTORE)" = "YES" || { echo "ERROR: restore replaces database contents; rerun with CONFIRM_RESTORE=YES BACKUP_FILE=..."; exit 1; }
	@test -n "$(PG_CONTAINER)" || { echo "ERROR: postgres container is not running; run 'make up' first."; exit 1; }
	@backup_file="$(BACKUP_FILE)"; \
	if [ -z "$$backup_file" ]; then \
		backup_file="$$(find "$(BACKUP_DIR)" -maxdepth 1 -type f -name 'vuka-*.dump' -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | cut -d' ' -f2-)"; \
	fi; \
	test -n "$$backup_file" || { echo "ERROR: no backup file found in $(BACKUP_DIR); set BACKUP_FILE=/path/to/backup.dump."; exit 1; }; \
	test -f "$$backup_file" || { echo "ERROR: backup file not found: $$backup_file"; exit 1; }; \
	echo "Restoring $$backup_file into $(PG_SUPER_DB)..."; \
	cat "$$backup_file" | docker exec -i "$(PG_CONTAINER)" pg_restore -U $(PG_USER) -d $(PG_SUPER_DB) --clean --if-exists --no-owner --exit-on-error
	@echo "Restore completed. Run the smoke checks before reopening traffic."

DRILL_DB ?= vuka_restore_drill

restore-drill:
	@test -n "$(PG_CONTAINER)" || { echo "ERROR: postgres container is not running; run 'make up' first."; exit 1; }
	@backup_file="$(BACKUP_FILE)"; \
	if [ -z "$$backup_file" ]; then \
		backup_file="$$(find "$(BACKUP_DIR)" -maxdepth 1 -type f -name 'vuka-*.dump' -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | cut -d' ' -f2-)"; \
	fi; \
	test -n "$$backup_file" && test -s "$$backup_file" || { echo "ERROR: no non-empty backup file found."; exit 1; }; \
	docker exec "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_SUPER_DB) -v ON_ERROR_STOP=1 \
		-c "DROP DATABASE IF EXISTS $(DRILL_DB);" \
		-c "CREATE DATABASE $(DRILL_DB);"; \
	trap 'docker exec "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(PG_SUPER_DB) -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $(DRILL_DB);" >/dev/null' EXIT; \
	echo "Restoring $$backup_file into disposable database $(DRILL_DB)..."; \
	cat "$$backup_file" | docker exec -i "$(PG_CONTAINER)" pg_restore -U $(PG_USER) -d $(DRILL_DB) --clean --if-exists --no-owner --exit-on-error; \
	echo "Checking restored schema and projections..."; \
	docker exec "$(PG_CONTAINER)" psql -U $(PG_USER) -d $(DRILL_DB) -v ON_ERROR_STOP=1 -Atc \
		"SELECT current_database(); \
		 SELECT to_regclass('public.escrows'); \
		 SELECT to_regclass('public.chain_events'); \
		 SELECT to_regclass('public.operator_activity'); \
		 SELECT to_regclass('public.organizations'); \
		 SELECT to_regclass('public.compliance_reviews'); \
		 SELECT COUNT(*) FROM escrows; \
		 SELECT COUNT(*) FROM chain_events; \
		 SELECT COUNT(*) FROM operator_activity; \
		 SELECT COUNT(*) FROM organizations; \
		 SELECT COUNT(*) FROM compliance_reviews; \
		 SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='escrows' AND column_name='timeout_at');"; \
	echo "Restore drill completed; disposable database will be removed."

# Start PostgreSQL and run the read-only Polygon escrow reconciler. The RPC
# endpoint and database DSN must be supplied by the caller; no private key is
# accepted or needed.
reconcile-run: up
	@set -a; [ ! -f "$(MKFILE_DIR)deploy/.env" ] || . "$(MKFILE_DIR)deploy/.env"; set +a; \
	if [ -z "$$VUKA_DATABASE_URL" ]; then \
		test -n "$$POSTGRES_PASSWORD" || { echo "ERROR: set VUKA_DATABASE_URL or POSTGRES_PASSWORD."; exit 1; }; \
		VUKA_DATABASE_URL="postgres://vuka:$$POSTGRES_PASSWORD@localhost:5433/vuka?sslmode=disable"; \
	fi; \
	export VUKA_DATABASE_URL; \
	test -n "$$VUKA_RECONCILIATION_RPC_URL" || { echo "ERROR: set VUKA_RECONCILIATION_RPC_URL."; exit 1; }; \
	test -n "$$VUKA_RECONCILIATION_CONTRACT" || { echo "ERROR: set VUKA_RECONCILIATION_CONTRACT."; exit 1; }; \
	cd $(MKFILE_DIR)go-bridge-core && \
		VUKA_DATABASE_URL="$$VUKA_DATABASE_URL" \
		VUKA_RECONCILIATION_ENABLED=true \
		VUKA_RECONCILIATION_RPC_URL="$$VUKA_RECONCILIATION_RPC_URL" \
		VUKA_RECONCILIATION_CHAIN_ID="$${VUKA_RECONCILIATION_CHAIN_ID:-80002}" \
		VUKA_RECONCILIATION_CONTRACT="$$VUKA_RECONCILIATION_CONTRACT" \
		VUKA_RECONCILIATION_CONFIRMATIONS="$${VUKA_RECONCILIATION_CONFIRMATIONS:-128}" \
		VUKA_RECONCILIATION_INTERVAL_MS="$${VUKA_RECONCILIATION_INTERVAL_MS:-15000}" \
		VUKA_RECONCILIATION_MAX_RANGE="$${VUKA_RECONCILIATION_MAX_RANGE:-9}" \
		VUKA_OPERATOR_EMAIL="$$VUKA_OPERATOR_EMAIL" \
		VUKA_OPERATOR_PASSWORD="$$VUKA_OPERATOR_PASSWORD" \
		VUKA_OPERATOR_ROLE="$${VUKA_OPERATOR_ROLE:-operator}" \
		go run ./cmd

# ---------------------------------------------------------------------------
# Phase 2 — Python ISO 20022 gateway
# ---------------------------------------------------------------------------

GATEWAY_DIR := $(MKFILE_DIR)python-iso-gateway
GATEWAY_VENV := $(GATEWAY_DIR)/.venv/bin
GATEWAY_PROTO := $(MKFILE_DIR)proto/vuka.proto

# Rebuild the generated gRPC stubs from the single source of truth.
proto-python:
	cd $(GATEWAY_DIR) && .venv/bin/python3 -m grpc_tools.protoc \
		-I$(MKFILE_DIR)proto --python_out=. --grpc_python_out=. $(GATEWAY_PROTO)

# Create the venv and install gateway dependencies.
gateway:
	cd $(GATEWAY_DIR) && test -d .venv || python3 -m venv .venv
	cd $(GATEWAY_DIR) && .venv/bin/pip install --quiet -e '.[dev]'
	$(MAKE) proto-python

# Run the Python test suite. Requires a live Go engine on
# VUKA_ENGINE_GRPC_ADDR (default localhost:50051).
VUKA_ENGINE_GRPC_ADDR ?= localhost:50051
gateway-test: gateway
	cd $(GATEWAY_DIR) && VUKA_ENGINE_GRPC_ADDR='$(VUKA_ENGINE_GRPC_ADDR)' \
		.venv/bin/python3 -m pytest -q

# Start the gateway with uvicorn (dev server; engine must already run).
gateway-run: gateway
	cd $(GATEWAY_DIR) && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8082

.PHONY: proto-python gateway gateway-test gateway-run

# ---------------------------------------------------------------------------
# Phase 3 — React/TS v2 operations dashboard
# ---------------------------------------------------------------------------

DASHBOARD_DIR := $(MKFILE_DIR)../FRONTEND/vuka-dashboard

# Install dashboard dependencies (npm). Run once after cloning.
dashboard-install:
	cd $(DASHBOARD_DIR) && npm install

# Typecheck + build the dashboard for production (deps must be installed).
dashboard-build:
	cd $(DASHBOARD_DIR) && npm run build

# Start the dashboard dev server (proxies /api to the Go engine on :8080).
# Deps must be installed first; requires the Go engine running.
dashboard-run:
	cd $(DASHBOARD_DIR) && npm run dev

# ---------------------------------------------------------------------------
# Live demo: seed demo traders, start engine + dashboard together
# ---------------------------------------------------------------------------

# Seed the demo traders into the running engine (idempotent via by-phone).
# Reads TEST_DATABASE_URL; falls back to the compose PG like `make test`.
DEMO_SEED_URL ?= $(TEST_DATABASE_URL)
demo-seed:
	@echo "Seeding demo traders into $(DEMO_SEED_URL)…"
	cd $(MKFILE_DIR)go-bridge-core && VUKA_DATABASE_URL='$(DEMO_SEED_URL)' \
		go run ./cmd/seed

# Seed a synthetic dispute and separate arbiter/operator accounts for local
# workflow testing. All four credential variables are required and local-only.
seed-dispute:
	@set -a; [ ! -f "$(MKFILE_DIR)deploy/.env" ] || . "$(MKFILE_DIR)deploy/.env"; set +a; \
	if [ -z "$$VUKA_DATABASE_URL" ]; then \
		test -n "$$POSTGRES_PASSWORD" || { echo "ERROR: set VUKA_DATABASE_URL or POSTGRES_PASSWORD."; exit 1; }; \
		VUKA_DATABASE_URL="postgres://vuka:$$POSTGRES_PASSWORD@localhost:5433/vuka?sslmode=disable"; \
	fi; \
	export VUKA_DATABASE_URL; \
	test -n "$$VUKA_SEED_ARBITER_EMAIL" || { echo "ERROR: set VUKA_SEED_ARBITER_EMAIL."; exit 1; }; \
	test -n "$$VUKA_SEED_ARBITER_PASSWORD" || { echo "ERROR: set VUKA_SEED_ARBITER_PASSWORD."; exit 1; }; \
	test -n "$$VUKA_SEED_OPERATOR_EMAIL" || { echo "ERROR: set VUKA_SEED_OPERATOR_EMAIL."; exit 1; }; \
	test -n "$$VUKA_SEED_OPERATOR_PASSWORD" || { echo "ERROR: set VUKA_SEED_OPERATOR_PASSWORD."; exit 1; }; \
	cd $(MKFILE_DIR)go-bridge-core && \
		VUKA_DATABASE_URL="$$VUKA_DATABASE_URL" \
		VUKA_SEED_ARBITER_EMAIL="$$VUKA_SEED_ARBITER_EMAIL" \
		VUKA_SEED_ARBITER_PASSWORD="$$VUKA_SEED_ARBITER_PASSWORD" \
		VUKA_SEED_OPERATOR_EMAIL="$$VUKA_SEED_OPERATOR_EMAIL" \
		VUKA_SEED_OPERATOR_PASSWORD="$$VUKA_SEED_OPERATOR_PASSWORD" \
		go run ./cmd/seed-dispute

# Seed local-only synthetic identity/compliance metadata. This command never
# accepts document bytes or calls an identity provider and refuses production.
identity-seed:
	@set -a; [ ! -f "$(MKFILE_DIR)deploy/.env" ] || . "$(MKFILE_DIR)deploy/.env"; set +a; \
	cd $(MKFILE_DIR)go-bridge-core && go run ./cmd/seed-identity

# Seed one local-only controlled settlement command. It never moves funds.
settlement-seed:
	cd $(MKFILE_DIR)go-bridge-core && go run ./cmd/seed-settlement

# Seed one local-only supervised pilot and the standard scenario catalogue.
pilot-seed:
	cd $(MKFILE_DIR)go-bridge-core && go run ./cmd/seed-pilot

# One-command live demo: engine (background) + dashboard (background).
# Prereqs: dockerized PG up (make up), deps installed (make dashboard-install).
demo: up
	@echo "=== VUKA live demo ==="
	@echo "1. Seeding demo traders…"
	$(MAKE) demo-seed
	@echo "2. Starting Go engine on :8080 (gRPC :50051)…"
	cd $(MKFILE_DIR)go-bridge-core && VUKA_DATABASE_URL='$(DEMO_SEED_URL)' \
		VUKA_HTTP_ADDR=':8080' VUKA_GRPC_ADDR=':50051' MTN_SIM_MODE=success \
		MTN_SIM_DELAY_MS=5 VUKA_FX_RWF_KES=9.5 \
		VUKA_READ_ONLY=false VUKA_LOCAL_SYNTHETIC_EXECUTION_ENABLED=true \
		VUKA_CORS_ORIGINS='http://localhost:5173' \
		go run ./cmd/ > /tmp/vuka-engine.log 2>&1 &
	@echo "3. Starting dashboard on http://localhost:5173…"
	cd $(DASHBOARD_DIR) && npm run dev > /tmp/vuka-dashboard.log 2>&1 &
	@echo "Open http://localhost:5173 — pick a demo trader and transact."
	@echo "Engine log: /tmp/vuka-engine.log | Dashboard log: /tmp/vuka-dashboard.log"
	@sleep 2 && curl -s http://localhost:8080/healthz && echo " (engine healthy)"

.PHONY: dashboard-install dashboard-build dashboard-run demo demo-seed seed-dispute identity-seed settlement-seed pilot-seed