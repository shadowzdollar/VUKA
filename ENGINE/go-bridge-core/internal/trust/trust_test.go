package trust

import (
	"testing"
	"time"
)

var now = time.Date(2026, 9, 21, 12, 0, 0, 0, time.UTC)

func tx(status string, daysAgo int, cp string) Tx {
	return Tx{Status: status, CreatedAt: now.Add(-time.Duration(daysAgo) * day), Counterparty: cp, Trade: true}
}

func TestNoHistoryIsUnrated(t *testing.T) {
	r := Compute(Input{Now: now})
	if r.Band != "Unrated" || r.Score != Min || r.CyclesScored != 0 {
		t.Fatalf("empty history = %+v", r)
	}
}

func TestWeightsSumToOneHundred(t *testing.T) {
	sum := 0
	for _, f := range Compute(Input{Now: now}).Factors {
		sum += f.Weight
	}
	if sum != 100 {
		t.Fatalf("weights sum to %d", sum)
	}
}

func TestOneLuckyPaymentCannotBuyATopScore(t *testing.T) {
	r := Compute(Input{Now: now, Transfers: []Tx{tx("SUCCESS", 1, "a")}, InvoicesTotal: 1, InvoicesPaid: 1})
	if r.Score >= 500 {
		t.Fatalf("a single payment scored %d; thin evidence must be discounted", r.Score)
	}
}

func TestStrongHistoryScoresHighAndFailuresHurt(t *testing.T) {
	var good []Tx
	for i := 0; i < 24; i++ {
		good = append(good, tx("SUCCESS", i, string(rune('a'+i%6))))
	}
	strong := Compute(Input{Now: now, Transfers: good, InvoicesTotal: 8, InvoicesPaid: 8})

	bad := append([]Tx{}, good...)
	for i := 0; i < 8; i++ {
		bad = append(bad, tx("FAILED", i, "x"), tx("REVERSED", i, "y"))
	}
	weak := Compute(Input{Now: now, Transfers: bad, InvoicesTotal: 8, InvoicesPaid: 2})

	if strong.Score < 700 {
		t.Fatalf("strong history scored %d (%s), want >= 700", strong.Score, strong.Band)
	}
	if weak.Score >= strong.Score {
		t.Fatalf("failures/reversals did not lower the score: weak %d vs strong %d", weak.Score, strong.Score)
	}
	if strong.Score > Max || weak.Score < Min {
		t.Fatalf("score out of range: %d / %d", strong.Score, weak.Score)
	}
}

func TestTopUpsAndInternalMovesAreNotSettlementCycles(t *testing.T) {
	r := Compute(Input{Now: now, Transfers: []Tx{
		{Status: "SUCCESS", CreatedAt: now, Trade: false},
		{Status: "SUCCESS", CreatedAt: now, Trade: false},
	}})
	if r.CyclesScored != 0 || r.Band != "Unrated" {
		t.Fatalf("non-trade transfers were scored: %+v", r)
	}
}

func TestDeterministic(t *testing.T) {
	in := Input{Now: now, Transfers: []Tx{tx("SUCCESS", 3, "a"), tx("SUCCESS", 40, "b")}, InvoicesTotal: 2, InvoicesPaid: 1}
	a, b := Compute(in), Compute(in)
	if a.Score != b.Score {
		t.Fatalf("non-deterministic: %d vs %d", a.Score, b.Score)
	}
}
