# ============================================================================
# VUKA — Go bridge/ledger engine, production image
#
# API-only image: the frontend (FRONTEND/, TanStack Start) deploys separately
# to Vercel and talks to this engine cross-origin over VITE_API_BASE_URL. This
# image does NOT bundle or serve the SPA — VUKA_WEB_DIR is intentionally left
# unset. Set VUKA_CORS_ORIGINS to the deployed frontend's origin, and
# VUKA_CROSS_SITE_COOKIES=true so session cookies survive the cross-site call.
#
#   docker build -f ENGINE/deploy/Dockerfile -t vuka-engine:latest .
#   docker run --rm -p 8080:8080 \
#     -e VUKA_DATABASE_URL=postgres://vuka:changeme@pg:5432/vuka?sslmode=disable \
#     -e VUKA_CORS_ORIGINS=https://your-frontend.example \
#     -e VUKA_CROSS_SITE_COOKIES=true \
#     vuka-engine:latest
# ============================================================================

# ---- Stage 1: build the Go engine (static binary, no CGO) ------------------
FROM golang:1.25-alpine AS engine

WORKDIR /src
COPY ENGINE/go-bridge-core/go.mod ENGINE/go-bridge-core/go.sum ./
RUN go mod download

COPY ENGINE/go-bridge-core/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/vuka-engine ./cmd/main.go

# ---- Stage 2: runtime (scratch-free alpine, ca-certs for outbound TLS) ------
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata && addgroup -S vuka && adduser -S -G vuka vuka

WORKDIR /app
COPY --from=engine /out/vuka-engine /usr/local/bin/vuka-engine

USER vuka
EXPOSE 8080 50051

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

ENV VUKA_HTTP_ADDR=:8080 \
    VUKA_GRPC_ADDR=:50051

ENTRYPOINT ["/usr/local/bin/vuka-engine"]
