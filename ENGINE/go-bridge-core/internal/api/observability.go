package api

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

// metrics is a tiny dependency-free Prometheus exposition: request counts by
// route/method/status class and a latency histogram. Enough for SLO alerting
// without pulling a client library into a payment-critical binary.
type metrics struct {
	mu       sync.Mutex
	started  time.Time
	requests map[string]uint64 // "method|route|class" -> count
	buckets  []float64
	hist     map[string][]uint64 // route -> cumulative-ready bucket counts (len = buckets+1)
	sum      map[string]float64
	count    map[string]uint64
}

func newMetrics() *metrics {
	return &metrics{
		started:  time.Now(),
		requests: map[string]uint64{},
		buckets:  []float64{0.005, 0.025, 0.1, 0.5, 2, 10},
		hist:     map[string][]uint64{},
		sum:      map[string]float64{},
		count:    map[string]uint64{},
	}
}

var idSegment = regexp.MustCompile(`^([0-9a-fA-F-]{16,}|\d+|wf-[0-9a-f]+|px-[0-9a-f]+)$`)

// routeLabel collapses identifiers so label cardinality stays bounded.
func routeLabel(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	for i, p := range parts {
		if idSegment.MatchString(p) {
			parts[i] = "{id}"
		}
	}
	return "/" + strings.Join(parts, "/")
}

func (m *metrics) observe(method, path string, status int, d time.Duration) {
	route := routeLabel(path)
	class := fmt.Sprintf("%dxx", status/100)
	sec := d.Seconds()
	m.mu.Lock()
	defer m.mu.Unlock()
	m.requests[method+"|"+route+"|"+class]++
	h, ok := m.hist[route]
	if !ok {
		h = make([]uint64, len(m.buckets)+1)
		m.hist[route] = h
	}
	idx := len(m.buckets)
	for i, b := range m.buckets {
		if sec <= b {
			idx = i
			break
		}
	}
	h[idx]++
	m.sum[route] += sec
	m.count[route]++
}

func (m *metrics) write(w io.Writer) {
	m.mu.Lock()
	defer m.mu.Unlock()
	fmt.Fprintln(w, "# HELP vuka_build_info Engine build marker.")
	fmt.Fprintln(w, "# TYPE vuka_build_info gauge")
	fmt.Fprintln(w, `vuka_build_info{api_version="1"} 1`)
	fmt.Fprintln(w, "# HELP vuka_uptime_seconds Seconds since start.")
	fmt.Fprintln(w, "# TYPE vuka_uptime_seconds gauge")
	fmt.Fprintf(w, "vuka_uptime_seconds %.0f\n", time.Since(m.started).Seconds())
	fmt.Fprintln(w, "# HELP vuka_http_requests_total HTTP requests by route, method and status class.")
	fmt.Fprintln(w, "# TYPE vuka_http_requests_total counter")
	keys := make([]string, 0, len(m.requests))
	for k := range m.requests {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		p := strings.SplitN(k, "|", 3)
		fmt.Fprintf(w, "vuka_http_requests_total{method=%q,route=%q,status_class=%q} %d\n", p[0], p[1], p[2], m.requests[k])
	}
	fmt.Fprintln(w, "# HELP vuka_http_request_duration_seconds Request latency by route.")
	fmt.Fprintln(w, "# TYPE vuka_http_request_duration_seconds histogram")
	routes := make([]string, 0, len(m.hist))
	for r := range m.hist {
		routes = append(routes, r)
	}
	sort.Strings(routes)
	for _, r := range routes {
		var cum uint64
		for i, b := range m.buckets {
			cum += m.hist[r][i]
			fmt.Fprintf(w, "vuka_http_request_duration_seconds_bucket{route=%q,le=%q} %d\n", r, fmt.Sprintf("%g", b), cum)
		}
		cum += m.hist[r][len(m.buckets)]
		fmt.Fprintf(w, "vuka_http_request_duration_seconds_bucket{route=%q,le=\"+Inf\"} %d\n", r, cum)
		fmt.Fprintf(w, "vuka_http_request_duration_seconds_sum{route=%q} %f\n", r, m.sum[r])
		fmt.Fprintf(w, "vuka_http_request_duration_seconds_count{route=%q} %d\n", r, m.count[r])
	}
}

// securityHeaders hardens every response. The API returns JSON/CSV only, so a
// deny-everything CSP is safe and prevents any accidental HTML from executing.
func securityHeaders(w http.ResponseWriter, r *http.Request) {
	h := w.Header()
	h.Set("X-Content-Type-Options", "nosniff")
	h.Set("X-Frame-Options", "DENY")
	h.Set("Referrer-Policy", "no-referrer")
	h.Set("Cross-Origin-Resource-Policy", "same-site")
	h.Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
	if strings.HasPrefix(r.URL.Path, "/api/") {
		h.Set("Cache-Control", "no-store")
		h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
	}
	if r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") {
		h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
	}
}
