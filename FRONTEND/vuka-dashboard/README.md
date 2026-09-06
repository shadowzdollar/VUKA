# VUKA Operations Dashboard

The v2 dashboard is a read-only operations surface for reconciled Polygon
escrow data. It deliberately does not connect wallets, sign transactions, or
call the escrow contract directly.

## Development

```bash
npm install
npm run dev
```

The Vite development server proxies `/api` and `/healthz` to the Go engine at
`http://localhost:8080`. Override the API and contract address with:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_ESCROW_CONTRACT=0x491a0E68B440621435B606D17FDa50f7999DE4ef
```

When `VUKA_OPERATOR_EMAIL` and `VUKA_OPERATOR_PASSWORD` are configured on the
Go engine, the dashboard displays an operator sign-in screen. The engine
stores only a bcrypt password hash and a hash of each expiring session token.

## Design system

The interface follows `frontend_color_guidelines.md` exactly: monochrome
surfaces only, with escrow states communicated through border weight and
inverted fills rather than color.
