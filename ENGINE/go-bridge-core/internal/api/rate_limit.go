package api

import (
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

// RateLimitMiddleware applies a fixed-window, in-process limit per client ID
// or source IP. A zero limit disables rate limiting.
func RateLimitMiddleware(next http.Handler, limit int, window time.Duration) http.Handler {
	if limit <= 0 || window <= 0 {
		return next
	}
	limiter := &rateLimiter{
		limit:  limit,
		window: window,
		seen:   make(map[string]windowCounter),
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Health probes and CORS preflights must remain available.
		if r.URL.Path == "/healthz" || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}
		key := clientKey(r)
		if retry, ok := limiter.allow(key, time.Now()); !ok {
			requestID := strings.TrimSpace(r.Header.Get("X-Request-ID"))
			if requestID == "" {
				requestID = fmt.Sprintf("vuka-%d", time.Now().UnixNano())
			}
			w.Header().Set("X-Request-ID", requestID)
			w.Header().Set("Retry-After", strconv.FormatInt(int64(retry.Seconds()+0.999), 10))
			writeError(w, http.StatusTooManyRequests, "rate_limited", "too many requests; retry later")
			return
		}
		next.ServeHTTP(w, r)
	})
}

type rateLimiter struct {
	mu     sync.Mutex
	limit  int
	window time.Duration
	seen   map[string]windowCounter
}

type windowCounter struct {
	start time.Time
	count int
}

func (l *rateLimiter) allow(key string, now time.Time) (time.Duration, bool) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if len(l.seen) > 1024 {
		for k, entry := range l.seen {
			if now.Sub(entry.start) >= l.window {
				delete(l.seen, k)
			}
		}
	}
	current, exists := l.seen[key]
	if !exists || now.Sub(current.start) >= l.window {
		l.seen[key] = windowCounter{start: now, count: 1}
		return 0, true
	}
	if current.count >= l.limit {
		return l.window - now.Sub(current.start), false
	}
	current.count++
	l.seen[key] = current
	return 0, true
}

func clientKey(r *http.Request) string {
	if client := strings.TrimSpace(r.Header.Get("X-Client-ID")); client != "" {
		return "client:" + client
	}
	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err != nil {
		host = strings.TrimSpace(r.RemoteAddr)
	}
	if host == "" {
		host = "unknown"
	}
	return "ip:" + host
}
