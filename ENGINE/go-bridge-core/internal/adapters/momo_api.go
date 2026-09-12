package adapters

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

// MoMoConfig contains MTN Mobile Money API credentials and subscription keys.
type MoMoConfig struct {
	SubscriptionKey string
	APIUser         string
	APIKey          string
	Environment     string // "sandbox" or "mtnrwanda" / "mtnuganda"
	CallbackURL     string
	Timeout         time.Duration
}

// MoMoAPIAdapter implements production-ready MTN MoMo API integrations.
type MoMoAPIAdapter struct {
	cfg        MoMoConfig
	httpClient *http.Client
	mu         sync.Mutex
	token      string
	expiresAt  time.Time
}

type momoTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

type momoRequestToPay struct {
	Amount       string          `json:"amount"`
	Currency     string          `json:"currency"`
	ExternalID   string          `json:"externalId"`
	Payer        momoParty       `json:"payer"`
	PayerMessage string          `json:"payerMessage"`
	PayeeNote    string          `json:"payeeNote"`
}

type momoTransfer struct {
	Amount       string          `json:"amount"`
	Currency     string          `json:"currency"`
	ExternalID   string          `json:"externalId"`
	Payee        momoParty       `json:"payee"`
	PayerMessage string          `json:"payerMessage"`
	PayeeNote    string          `json:"payeeNote"`
}

type momoParty struct {
	PartyIdType string `json:"partyIdType"` // "MSISDN"
	PartyId     string `json:"partyId"`     // phone number without '+'
}

func NewMoMoAPIAdapter(cfg MoMoConfig) *MoMoAPIAdapter {
	if cfg.Timeout <= 0 {
		cfg.Timeout = 15 * time.Second
	}
	return &MoMoAPIAdapter{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

func (a *MoMoAPIAdapter) Name() string {
	return "mtn-momo-api"
}

func (a *MoMoAPIAdapter) ContractVersion() string {
	return ContractVersion
}

func (a *MoMoAPIAdapter) Environment() string {
	if a.cfg.Environment == "" {
		return "sandbox"
	}
	return a.cfg.Environment
}

func (a *MoMoAPIAdapter) CredentialsConfigured() bool {
	return a.cfg.SubscriptionKey != "" && a.cfg.APIUser != "" && a.cfg.APIKey != ""
}

func (a *MoMoAPIAdapter) ValidateConfig() error {
	if !a.CredentialsConfigured() {
		return fmt.Errorf("mtn-momo-api: missing SubscriptionKey, APIUser, or APIKey")
	}
	return nil
}

func (a *MoMoAPIAdapter) baseURL() string {
	if strings.ToLower(a.cfg.Environment) == "sandbox" || a.cfg.Environment == "" {
		return "https://sandbox.momodeveloper.mtn.com"
	}
	return "https://proxy.momo.mtn.com"
}

func (a *MoMoAPIAdapter) getAuthToken(ctx context.Context, product string) (string, error) {
	a.mu.Lock()
	if a.token != "" && time.Now().Before(a.expiresAt.Add(-30*time.Second)) {
		token := a.token
		a.mu.Unlock()
		return token, nil
	}
	a.mu.Unlock()

	url := fmt.Sprintf("%s/%s/token/", a.baseURL(), product)
	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return "", fmt.Errorf("mtn-momo-api: new token req: %w", err)
	}

	authHeader := base64.StdEncoding.EncodeToString([]byte(a.cfg.APIUser + ":" + a.cfg.APIKey))
	req.Header.Set("Authorization", "Basic "+authHeader)
	req.Header.Set("Ocp-Apim-Subscription-Key", a.cfg.SubscriptionKey)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("mtn-momo-api: token call failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("mtn-momo-api: token status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp momoTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", fmt.Errorf("mtn-momo-api: decode token resp: %w", err)
	}

	a.mu.Lock()
	a.token = tokenResp.AccessToken
	a.expiresAt = time.Now().Add(time.Duration(tokenResp.ExpiresIn-60) * time.Second)
	a.mu.Unlock()

	return tokenResp.AccessToken, nil
}

// Collection initiates a RequestToPay.
func (a *MoMoAPIAdapter) Collection(ctx context.Context, req CollectionRequest) (*CollectionResult, error) {
	token, err := a.getAuthToken(ctx, "collection")
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCollectionFailed, err)
	}

	phone := strings.TrimPrefix(req.Phone, "+")
	payload := momoRequestToPay{
		Amount:   fmt.Sprintf("%.0f", req.Amount),
		Currency: req.Currency,
		ExternalID: req.Reference,
		Payer: momoParty{
			PartyIdType: "MSISDN",
			PartyId:     phone,
		},
		PayerMessage: "VUKA Trade Deposit: " + req.InvoiceNumber,
		PayeeNote:    "Invoice " + req.InvoiceNumber,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("mtn-momo-api: marshal req: %w", err)
	}

	url := a.baseURL() + "/collection/v1_0/requesttopay"
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("mtn-momo-api: new requesttopay: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("X-Reference-Id", req.Reference)
	httpReq.Header.Set("X-Target-Environment", a.Environment())
	httpReq.Header.Set("Ocp-Apim-Subscription-Key", a.cfg.SubscriptionKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := a.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCollectionTimeout, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("%w: status %d body %s", ErrCollectionFailed, resp.StatusCode, string(respBody))
	}

	return &CollectionResult{
		ExternalRef: req.Reference,
		Raw:         fmt.Sprintf(`{"status":"ACCEPTED","reference_id":%q}`, req.Reference),
	}, nil
}

func (a *MoMoAPIAdapter) Collect(ctx context.Context, req CollectionRequest) (*CollectionResult, error) {
	return a.Collection(ctx, req)
}

// Payout initiates a Disbursement Transfer.
func (a *MoMoAPIAdapter) Payout(ctx context.Context, req PayoutRequest) (*PayoutResult, error) {
	token, err := a.getAuthToken(ctx, "disbursement")
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPayoutFailed, err)
	}

	phone := strings.TrimPrefix(req.Phone, "+")
	payload := momoTransfer{
		Amount:   fmt.Sprintf("%.0f", req.Amount),
		Currency: req.Currency,
		ExternalID: req.Reference,
		Payee: momoParty{
			PartyIdType: "MSISDN",
			PartyId:     phone,
		},
		PayerMessage: "VUKA Escrow Release: " + req.InvoiceNumber,
		PayeeNote:    "Invoice " + req.InvoiceNumber,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("mtn-momo-api: marshal transfer: %w", err)
	}

	url := a.baseURL() + "/disbursement/v1_0/transfer"
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("mtn-momo-api: new transfer req: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("X-Reference-Id", req.Reference)
	httpReq.Header.Set("X-Target-Environment", a.Environment())
	httpReq.Header.Set("Ocp-Apim-Subscription-Key", a.cfg.SubscriptionKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := a.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPayoutTimeout, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("%w: status %d body %s", ErrPayoutFailed, resp.StatusCode, string(respBody))
	}

	return &PayoutResult{
		ExternalRef: req.Reference,
		Raw:         fmt.Sprintf(`{"status":"ACCEPTED","reference_id":%q}`, req.Reference),
	}, nil
}
