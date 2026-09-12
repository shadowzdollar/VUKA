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

// DarajaConfig contains Safaricom M-Pesa API credentials and endpoints.
type DarajaConfig struct {
	ConsumerKey    string
	ConsumerSecret string
	PassKey        string
	ShortCode      string
	B2CShortCode   string
	InitiatorName  string
	SecurityCredential string
	CallbackURL    string
	Environment    string // "sandbox" or "production"
	Timeout        time.Duration
}

// MpesaDarajaAdapter implements production-ready Safaricom M-Pesa Daraja integrations.
type MpesaDarajaAdapter struct {
	cfg        DarajaConfig
	httpClient *http.Client
	mu         sync.Mutex
	token      string
	expiresAt  time.Time
}

type darajaAuthResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   string `json:"expires_in"`
}

type stkPushRequest struct {
	BusinessShortCode string `json:"BusinessShortCode"`
	Password          string `json:"Password"`
	Timestamp         string `json:"Timestamp"`
	TransactionType   string `json:"TransactionType"`
	Amount            string `json:"Amount"`
	PartyA            string `json:"PartyA"`
	PartyB            string `json:"PartyB"`
	PhoneNumber       string `json:"PhoneNumber"`
	CallBackURL       string `json:"CallBackURL"`
	AccountReference  string `json:"AccountReference"`
	TransactionDesc   string `json:"TransactionDesc"`
}

type stkPushResponse struct {
	MerchantRequestID   string `json:"MerchantRequestID"`
	CheckoutRequestID   string `json:"CheckoutRequestID"`
	ResponseCode        string `json:"ResponseCode"`
	ResponseDescription string `json:"ResponseDescription"`
	CustomerMessage     string `json:"CustomerMessage"`
}

type b2cRequest struct {
	InitiatorName      string `json:"InitiatorName"`
	SecurityCredential string `json:"SecurityCredential"`
	CommandID          string `json:"CommandID"`
	Amount             string `json:"Amount"`
	PartyA             string `json:"PartyA"`
	PartyB             string `json:"PartyB"`
	Remarks            string `json:"Remarks"`
	QueueTimeOutURL    string `json:"QueueTimeOutURL"`
	ResultURL          string `json:"ResultURL"`
	Occasion           string `json:"Occasion"`
}

type b2cResponse struct {
	ConversationID           string `json:"ConversationID"`
	OriginatorConversationID string `json:"OriginatorConversationID"`
	ResponseCode             string `json:"ResponseCode"`
	ResponseDescription      string `json:"ResponseDescription"`
}

func NewMpesaDarajaAdapter(cfg DarajaConfig) *MpesaDarajaAdapter {
	if cfg.Timeout <= 0 {
		cfg.Timeout = 15 * time.Second
	}
	return &MpesaDarajaAdapter{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

func (a *MpesaDarajaAdapter) Name() string {
	return "mpesa-daraja"
}

func (a *MpesaDarajaAdapter) ContractVersion() string {
	return ContractVersion
}

func (a *MpesaDarajaAdapter) Environment() string {
	if a.cfg.Environment == "" {
		return "sandbox"
	}
	return a.cfg.Environment
}

func (a *MpesaDarajaAdapter) CredentialsConfigured() bool {
	return a.cfg.ConsumerKey != "" && a.cfg.ConsumerSecret != ""
}

func (a *MpesaDarajaAdapter) ValidateConfig() error {
	if !a.CredentialsConfigured() {
		return fmt.Errorf("mpesa-daraja: missing ConsumerKey or ConsumerSecret")
	}
	if a.cfg.ShortCode == "" {
		return fmt.Errorf("mpesa-daraja: missing ShortCode")
	}
	return nil
}

func (a *MpesaDarajaAdapter) baseURL() string {
	if strings.ToLower(a.cfg.Environment) == "production" {
		return "https://api.safaricom.co.ke"
	}
	return "https://sandbox.safaricom.co.ke"
}

func (a *MpesaDarajaAdapter) getAuthToken(ctx context.Context) (string, error) {
	a.mu.Lock()
	if a.token != "" && time.Now().Before(a.expiresAt.Add(-30*time.Second)) {
		token := a.token
		a.mu.Unlock()
		return token, nil
	}
	a.mu.Unlock()

	url := a.baseURL() + "/oauth/v1/generate?grant_type=client_credentials"
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("mpesa-daraja: new auth req: %w", err)
	}

	authHeader := base64.StdEncoding.EncodeToString([]byte(a.cfg.ConsumerKey + ":" + a.cfg.ConsumerSecret))
	req.Header.Set("Authorization", "Basic "+authHeader)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("mpesa-daraja: auth call failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("mpesa-daraja: auth status %d: %s", resp.StatusCode, string(body))
	}

	var authResp darajaAuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return "", fmt.Errorf("mpesa-daraja: decode auth resp: %w", err)
	}

	a.mu.Lock()
	a.token = authResp.AccessToken
	a.expiresAt = time.Now().Add(3500 * time.Second)
	a.mu.Unlock()

	return authResp.AccessToken, nil
}

// Collection initiates an STK Push (Customer to Business).
func (a *MpesaDarajaAdapter) Collection(ctx context.Context, req CollectionRequest) (*CollectionResult, error) {
	token, err := a.getAuthToken(ctx)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCollectionFailed, err)
	}

	timestamp := time.Now().Format("20060102150405")
	password := base64.StdEncoding.EncodeToString([]byte(a.cfg.ShortCode + a.cfg.PassKey + timestamp))

	phone := strings.TrimPrefix(req.Phone, "+")
	payload := stkPushRequest{
		BusinessShortCode: a.cfg.ShortCode,
		Password:          password,
		Timestamp:         timestamp,
		TransactionType:   "CustomerPayBillOnline",
		Amount:            fmt.Sprintf("%.0f", req.Amount),
		PartyA:            phone,
		PartyB:            a.cfg.ShortCode,
		PhoneNumber:       phone,
		CallBackURL:       a.cfg.CallbackURL,
		AccountReference:  req.InvoiceNumber,
		TransactionDesc:   "VUKA Escrow Trade Lock",
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("mpesa-daraja: marshal stk req: %w", err)
	}

	url := a.baseURL() + "/mpesa/stkpush/v1/processrequest"
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("mpesa-daraja: new stk req: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := a.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCollectionTimeout, err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: status %d body %s", ErrCollectionFailed, resp.StatusCode, string(respBody))
	}

	var stkResp stkPushResponse
	if err := json.Unmarshal(respBody, &stkResp); err != nil {
		return nil, fmt.Errorf("mpesa-daraja: decode stk resp: %w", err)
	}

	if stkResp.ResponseCode != "0" {
		return nil, fmt.Errorf("%w: %s", ErrCollectionFailed, stkResp.ResponseDescription)
	}

	return &CollectionResult{
		ExternalRef: stkResp.CheckoutRequestID,
		Raw:         string(respBody),
	}, nil
}

func (a *MpesaDarajaAdapter) Collect(ctx context.Context, req CollectionRequest) (*CollectionResult, error) {
	return a.Collection(ctx, req)
}

// Payout initiates a Business to Customer (B2C) transfer.
func (a *MpesaDarajaAdapter) Payout(ctx context.Context, req PayoutRequest) (*PayoutResult, error) {
	token, err := a.getAuthToken(ctx)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPayoutFailed, err)
	}

	phone := strings.TrimPrefix(req.Phone, "+")
	b2cShortCode := a.cfg.B2CShortCode
	if b2cShortCode == "" {
		b2cShortCode = a.cfg.ShortCode
	}

	payload := b2cRequest{
		InitiatorName:      a.cfg.InitiatorName,
		SecurityCredential: a.cfg.SecurityCredential,
		CommandID:          "BusinessPayment",
		Amount:             fmt.Sprintf("%.0f", req.Amount),
		PartyA:             b2cShortCode,
		PartyB:             phone,
		Remarks:            "VUKA Trade Release: " + req.InvoiceNumber,
		QueueTimeOutURL:    a.cfg.CallbackURL + "/timeout",
		ResultURL:          a.cfg.CallbackURL + "/result",
		Occasion:           req.Reference,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("mpesa-daraja: marshal b2c req: %w", err)
	}

	url := a.baseURL() + "/mpesa/b2c/v1/paymentrequest"
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("mpesa-daraja: new b2c req: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := a.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPayoutTimeout, err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: status %d body %s", ErrPayoutFailed, resp.StatusCode, string(respBody))
	}

	var b2cResp b2cResponse
	if err := json.Unmarshal(respBody, &b2cResp); err != nil {
		return nil, fmt.Errorf("mpesa-daraja: decode b2c resp: %w", err)
	}

	if b2cResp.ResponseCode != "0" {
		return nil, fmt.Errorf("%w: %s", ErrPayoutFailed, b2cResp.ResponseDescription)
	}

	return &PayoutResult{
		ExternalRef: b2cResp.ConversationID,
		Raw:         string(respBody),
	}, nil
}
