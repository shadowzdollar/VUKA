package analytics

import (
	"math"
	"testing"
	"time"
)

type fx map[string]float64

func (f fx) ToUSD(a float64, c string) (float64, error) { return a / f[c], nil }

var now = time.Date(2026, 9, 21, 15, 0, 0, 0, time.UTC) // a Monday

func pay(status, from, to string, amt float64, daysAgo int, hour int, fu, tu string) Row {
	return Row{Status: status, Amount: amt, Currency: from, ToCurrency: to, FromType: "BUSINESS", ToType: "BUSINESS",
		FromUser: fu, ToUser: tu, CreatedAt: time.Date(2026, 9, 21-daysAgo, hour, 0, 0, 0, time.UTC)}
}

var rates = fx{"USD": 1, "RWF": 1000, "KES": 100}

func TestHistogramBucketsAreHalfOpenAndOpenEnded(t *testing.T) {
	for usd, want := range map[float64]int{0: 0, 9.99: 0, 10: 1, 49: 1, 50: 2, 99.99: 2, 100: 3, 250: 4, 999: 5, 1000: 6, 4999: 6, 5000: 7, 1e6: 7} {
		if got := bucketIndex(usd); got != want {
			t.Errorf("bucketIndex(%v) = %d, want %d", usd, got, want)
		}
	}
	h := newHistogram()
	if h[7].Max != 0 || h[7].Label != "$5k+" || h[0].Label != "$0–$10" {
		t.Fatalf("labels = %+v", h)
	}
}

func TestTraderReportSplitsDirectionsAndIgnoresTopUps(t *testing.T) {
	rows := []Row{
		pay("SUCCESS", "RWF", "RWF", 50_000, 0, 9, "me", "bob"),  // out $50
		pay("SUCCESS", "RWF", "RWF", 20_000, 1, 10, "amy", "me"), // in $20
		pay("FAILED", "RWF", "RWF", 90_000, 1, 11, "me", "bob"),  // failed: not volume
		pay("REVERSED", "RWF", "RWF", 10_000, 2, 12, "me", "bob"),
		{Status: "SUCCESS", Amount: 999_000, Currency: "RWF", ToCurrency: "RWF", FromType: "SETTLEMENT", ToType: "BUSINESS", FromUser: "sys", ToUser: "me", CreatedAt: now}, // top-up
		pay("SUCCESS", "RWF", "KES", 100_000, 0, 9, "me", "kev"), // cross-currency out $100
	}
	rows[0].Counterparty, rows[5].Counterparty = "Bob", "Kev"
	rep, err := Aggregate(rows, rates, "me", 30, now, "test")
	if err != nil {
		t.Fatal(err)
	}
	tt := rep.Totals
	if tt.SentUSD != 150 || tt.ReceivedUSD != 20 || tt.CashInUSD != 999 {
		t.Fatalf("sent/received/cash-in = %v/%v/%v", tt.SentUSD, tt.ReceivedUSD, tt.CashInUSD)
	}
	if tt.Payments != 5 || tt.Succeeded != 3 || tt.Failed != 1 || tt.Reversed != 1 {
		t.Fatalf("counts = %+v", tt)
	}
	if math.Abs(tt.SuccessRate-3.0/5.0) > 1e-9 {
		t.Fatalf("success rate = %v", tt.SuccessRate)
	}
	if tt.CrossCurrency != 1 || len(rep.Corridors) != 1 || rep.Corridors[0].From != "RWF" || rep.Corridors[0].To != "KES" || rep.Corridors[0].VolumeUSD != 100 {
		t.Fatalf("corridors = %+v", rep.Corridors)
	}
	if len(rep.Daily) != 30 || rep.Daily[29].OutUSD != 150 || rep.Daily[28].InUSD != 20 {
		t.Fatalf("daily tail = %+v %+v", rep.Daily[28], rep.Daily[29])
	}
	if len(rep.Counterparties) != 2 || rep.Counterparties[0].Name != "Kev" {
		t.Fatalf("counterparties = %+v", rep.Counterparties)
	}
	// Monday 09:00 UTC has the two payments made that day at 9.
	if rep.Heatmap[0][9] != 2 {
		t.Fatalf("heatmap[Mon][9] = %d", rep.Heatmap[0][9])
	}
	var hist int
	for _, b := range rep.Histogram {
		hist += b.Count
	}
	if hist != tt.Succeeded {
		t.Fatalf("histogram counts %d, want %d successful payments", hist, tt.Succeeded)
	}
}

func TestPlatformReportCountsEveryPaymentOnce(t *testing.T) {
	rows := []Row{
		pay("SUCCESS", "KES", "KES", 10_000, 0, 1, "a", "b"),
		pay("SUCCESS", "RWF", "KES", 50_000, 3, 2, "c", "d"),
		pay("FAILED", "RWF", "RWF", 1_000, 3, 2, "c", "d"),
	}
	rep, err := Aggregate(rows, rates, "", 14, now, "test")
	if err != nil {
		t.Fatal(err)
	}
	if rep.Scope != "platform" || rep.Totals.VolumeUSD != 150 || rep.Totals.Payments != 3 {
		t.Fatalf("platform totals = %+v", rep.Totals)
	}
	if len(rep.Daily) != 14 || rep.Daily[13].OutUSD != 100 || rep.Daily[10].OutUSD != 50 || rep.Daily[10].Failed != 1 {
		t.Fatalf("daily = %+v", rep.Daily)
	}
}

func TestOldRowsOutsideThePeriodAreIgnoredAndEmptyIsSafe(t *testing.T) {
	old := pay("SUCCESS", "RWF", "RWF", 1_000_000, 60, 3, "a", "b")
	rep, err := Aggregate([]Row{old}, rates, "", 30, now, "test")
	if err != nil || rep.Totals.Payments != 0 || rep.Totals.VolumeUSD != 0 {
		t.Fatalf("old row leaked into the period: %+v %v", rep.Totals, err)
	}
	empty, _ := Aggregate(nil, rates, "x", 7, now, "test")
	if empty.Totals.SuccessRate != 0 || empty.Totals.AvgPaymentUSD != 0 || len(empty.Daily) != 7 || len(empty.Histogram) != 8 {
		t.Fatalf("empty report = %+v", empty.Totals)
	}
}

func TestClampDays(t *testing.T) {
	for in, want := range map[int]int{0: 30, 3: 30, 7: 7, 90: 90, 400: 365} {
		if got := clampDays(in); got != want {
			t.Errorf("clampDays(%d) = %d, want %d", in, got, want)
		}
	}
}
