// Package main — demo trader seeder.
//
// `go run ./cmd/seed` (or `make demo-seed`) creates the demo traders the
// dashboard's TraderSelect page expects. It is idempotent: a trader whose
// phone already exists is looked up and skipped, so re-running is safe.
//
// The three demo traders mirror the DEMO_TRADERS list in
// FRONTEND/web-dashboard/src/pages/TraderSelect.tsx. A KES trader is included
// so the dashboard can demonstrate the cross-border (RWF -> KES) story.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"vuka/go-bridge-core/internal/adapters"
	"vuka/go-bridge-core/internal/api"
	"vuka/go-bridge-core/internal/config"
	"vuka/go-bridge-core/internal/idempotency"
	"vuka/go-bridge-core/internal/ledger"
)

type demoTrader struct {
	name        string
	phone       string
	currency    string
	businessReg string
}

var demoTraders = []demoTrader{
	{name: "Amina Uwera", phone: "+250700000991", currency: "RWF", businessReg: "RWC-2026-0441"},
	{name: "Kethan Gasana", phone: "+254700000882", currency: "KES", businessReg: "RWC-2026-0772"},
	{name: "Jean-Paul Niyonzima", phone: "+250700000773", currency: "RWF", businessReg: "RWC-2026-0108"},
}

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		log.Error("config", "err", err)
		os.Exit(1)
	}
	// These are demo accounts with a well-known, publicly documented fallback password
	// (VUKA_DEMO_TRADER_PASSWORD, default "vuka-demo-2026"); never create them in production.
	if cfg.Environment == "production" {
		log.Error("refusing to seed demo traders in production")
		os.Exit(1)
	}
	if cfg.DatabaseURL == "" {
		log.Error("VUKA_DATABASE_URL is required")
		os.Exit(1)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("connect", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	reg := adapters.NewRegistry()
	reg.Register(adapters.NewMTNAdapter(0, 0, "success", 5*time.Second))
	reg.Register(adapters.NewMpesaAdapter(0, 0, "success", 5*time.Second))
	svc := ledger.NewService(pool, idempotency.NewStore(pool), reg)
	authStore := api.NewAuthStore(pool)
	if err := authStore.EnsureSchema(ctx); err != nil {
		log.Error("ensure auth schema", "err", err)
		os.Exit(1)
	}
	demoPassword := os.Getenv("VUKA_DEMO_TRADER_PASSWORD")
	if demoPassword == "" {
		demoPassword = "vuka-demo-2026" // #nosec G101 -- publicly documented demo-only default; production is refused above
	}

	for _, d := range demoTraders {
		user, err := svc.GetUserByPhone(ctx, d.phone)
		if err != nil {
			user, _, err = svc.CreateUser(ctx, ledger.CreateUserRequest{
				FullName:          d.name,
				PhoneNumber:       d.phone,
				BusinessRegNumber: d.businessReg,
			}, d.currency)
			if err != nil {
				log.Error("create", "name", d.name, "err", err)
				os.Exit(1)
			}
			log.Info("seeded demo trader", "name", d.name, "id", user.ID)
		} else {
			log.Info("demo trader already exists", "name", d.name, "id", user.ID)
		}
		if err := authStore.EnsureTraderPassword(ctx, user.ID, demoPassword); err != nil {
			log.Error("ensure trader password", "name", d.name, "err", err)
			os.Exit(1)
		}
		business, err := svc.GetAccountByUserAndType(ctx, user.ID, ledger.AccountTypeBusiness)
		if err != nil {
			log.Error("find business account", "name", d.name, "err", err)
			os.Exit(1)
		}
		fundAmount := 250000.0
		if d.currency == "KES" {
			fundAmount = 25000
		}
		if _, err := svc.FundAccount(ctx, business.ID, "demo-funding-"+user.ID, ledger.FundRequest{
			Amount: fundAmount, Currency: d.currency, Reference: "local-demo-fixture",
		}); err != nil {
			log.Error("fund demo trader", "name", d.name, "err", err)
			os.Exit(1)
		}
		log.Info("demo trader ready", "name", d.name, "business_account", business.ID, "funded", fundAmount, "currency", d.currency)
	}

	if err := seedInvoices(ctx, svc, log); err != nil {
		log.Error("seed invoices", "err", err)
		os.Exit(1)
	}

	log.Info("demo seeding complete")
}

// seedInvoices creates a real invoice document for every invoice number that
// the ledger's transfer register references, so the dashboard's Invoices page
// shows the documents behind the paid transfers instead of an empty list.
// Idempotent: an invoice number that already exists is skipped.
func seedInvoices(ctx context.Context, svc *ledger.Service, log *slog.Logger) error {
	// Resolve the demo traders' ids so invoices link real users.
	traders := make(map[string]string) // phone -> id
	for _, d := range demoTraders {
		u, err := svc.GetUserByPhone(ctx, d.phone)
		if err != nil {
			log.Warn("skip invoice seeding: trader missing", "name", d.name, "err", err)
			continue
		}
		traders[d.phone] = u.ID
	}
	// The seeded history is Amina (importer) paying her suppliers. The seller
	// behind an invoice reference depends on the corridor: RWF refs settle to
	// Jean-Paul (Musanze exporter), KES refs settle to Kethan (Nairobi
	// supplier) via the cross-border rail. Resolve by name to avoid phone
	// literals here.
	buyerID, buyerOK := resolveByName(traders, demoTraders, "Amina Uwera")
	if !buyerOK {
		return fmt.Errorf("invoice seeding needs the buyer trader")
	}

	// Distinct invoice numbers referenced by real transfers, with the settled
	// amount and status derived from the ledger register itself.
	refs, err := svc.ListInvoiceReferences(ctx)
	if err != nil {
		return fmt.Errorf("list invoice references: %w", err)
	}

	issued := 0
	for _, r := range refs {
		if _, err := svc.GetInvoiceByNumber(ctx, r.Number); err == nil {
			log.Info("invoice already exists", "number", r.Number)
			continue
		}
		// The seller behind an invoice reference depends on the corridor:
		// domestic RWF refs settle to Jean-Paul (Musanze exporter), refs that
		// crossed the corridor (fx_rate set) settled to Kethan (Nairobi
		// supplier) and are billed in KES. Resolve by name to avoid repeating
		// phone literals here.
		sellerName := "Jean-Paul Niyonzima" // domestic RWF
		invCurrency := r.Currency
		if r.CrossBorder {
			sellerName = "Kethan Gasana"
			invCurrency = "KES"
		}
		sellerID, ok := resolveByName(traders, demoTraders, sellerName)
		if !ok {
			log.Warn("skip invoice: seller not seeded", "name", sellerName, "number", r.Number)
			continue
		}
		// The settled amount follows the invoice currency: for cross-border
		// refs the register amount is the RWF source leg, so the KES invoice
		// amount is the converted destination leg (round to 2dp).
		invAmount := r.Amount
		if r.CrossBorder && r.FxRate > 0 {
			invAmount = math.Round(r.Amount/r.FxRate*100) / 100
		}
		date := time.Now().AddDate(0, 0, -3).Format("2006-01-02")
		due := time.Now().AddDate(0, 0, 14).Format("2006-01-02")
		inv, err := svc.CreateInvoice(ctx, sellerID, ledger.CreateInvoiceRequest{
			Number:             r.Number,
			CounterpartyUserID: buyerID,
			Currency:           invCurrency,
			IssueDate:          date,
			DueDate:            due,
			VATRate:            18,
			Terms:              "Net 14 — settled via VUKA cross-border rail.",
			Notes:              "Seeded from the engine transfer register.",
			Items: []ledger.InvoiceItemRequest{
				{Description: "Cross-border goods invoice " + r.Number, Quantity: 1, UnitPrice: invAmount / 1.18},
			},
		})
		if err != nil {
			// A reference left over from an older, buggy seeder run (e.g. one that
			// didn't match INV-YYYY-NNN) shouldn't abort seeding everything else.
			if errors.Is(err, ledger.ErrInvalidInvoiceNumber) {
				log.Warn("skip invoice: number does not match INV-YYYY-NNN", "number", r.Number)
				continue
			}
			return fmt.Errorf("create invoice %s: %w", r.Number, err)
		}
		issued++
		log.Info("seeded invoice", "number", inv.Number, "status", inv.Status)
	}
	log.Info("invoice seeding complete", "referenced", len(refs), "created", issued)
	return nil
}

// resolveByName maps a demo trader's display name to the user id captured
// from the engine, using the phone in the source list (never a typed literal).
func resolveByName(ids map[string]string, traders []demoTrader, name string) (string, bool) {
	for _, d := range traders {
		if d.name == name {
			id, ok := ids[d.phone]
			return id, ok
		}
	}
	return "", false
}
