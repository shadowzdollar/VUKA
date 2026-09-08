package reconciliation

import "testing"

func TestAlertLevel(t *testing.T) {
	tests := []struct {
		name                    string
		lag                     int64
		errors                  uint64
		warningLag, criticalLag int64
		want                    string
	}{
		{name: "within range", lag: 50, warningLag: 50, criticalLag: 500, want: "ok"},
		{name: "warning above threshold", lag: 51, warningLag: 50, criticalLag: 500, want: "warning"},
		{name: "critical above threshold", lag: 501, warningLag: 50, criticalLag: 500, want: "critical"},
		{name: "worker error is critical", lag: 0, errors: 1, warningLag: 50, criticalLag: 500, want: "critical"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := alertLevel(test.lag, test.errors, test.warningLag, test.criticalLag); got != test.want {
				t.Fatalf("alertLevel() = %q, want %q", got, test.want)
			}
		})
	}
}
