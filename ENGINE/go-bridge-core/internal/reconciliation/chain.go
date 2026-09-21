package reconciliation

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
)

const (
	topicEscrowCreated       = "dc9a04dd5e45e9ab6f396372e092b395e6523394518e770849fe9f49c61d96b5"
	topicFundsLocked         = "116c1aa90d7c9aeabdd6dc366dc0def60808db13d9c05023bde6fe57ca7625a8"
	topicCompletionConfirmed = "4e49e2d3c8ae26600fd3fde8c51304185090f46a8a990173913e4067f72bfd3e"
	topicDisputeRaised       = "1b84372106d77c6daea0dda35bbc0229d10a83f58ec899092884925193682341"
	topicEscrowReleased      = "efc7f1f15becfaec7a3c17eec78be3fa7adb45698f26fcfd25efe1754c242331"
	topicEscrowRefunded      = "4022ec06c48ff8ef53ec31d435dd9408ba9fd88c7faa90b2a6b9e5a2b339c1f2"
	topicDisputeResolved     = "5a87909bff68caaaaf0b3fd9c74eeccc928832f879315e5c6fb7a73612f26c0c"

	// VukaEscrowV2 (keccak256 of the event signature).
	topicEscrowSplit          = "889eb4c83e70d971f8e5114f5024e5e51c746b12f5211c9966ee87d2d860f9b0"
	topicProtocolFeeCollected = "3e4febac6100e201db638e98000ef75bf1b86e7187ecd61f2ad8918c293f43ca"
	topicPayoutDeferred       = "54ce20b025f500d61d580ad59a7050cc533f69121275cfe095ef32ec9976df90"
)

type rpcLog struct {
	Address     string   `json:"address"`
	Topics      []string `json:"topics"`
	Data        string   `json:"data"`
	BlockNumber string   `json:"blockNumber"`
	BlockHash   string   `json:"blockHash"`
	TxHash      string   `json:"transactionHash"`
	LogIndex    string   `json:"logIndex"`
}

type rpcClient struct {
	url    string
	client *http.Client
}

func newRPCClient(url string) *rpcClient {
	return &rpcClient{url: url, client: &http.Client{}}
}

func (c *rpcClient) call(ctx context.Context, method string, params any, result any) error {
	body, err := json.Marshal(map[string]any{"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
	if err != nil {
		return fmt.Errorf("reconciliation: encode RPC request: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("reconciliation: create RPC request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("reconciliation: RPC request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("reconciliation: RPC HTTP status %s", resp.Status)
	}
	var envelope struct {
		Result json.RawMessage `json:"result"`
		Error  *struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return fmt.Errorf("reconciliation: decode RPC response: %w", err)
	}
	if envelope.Error != nil {
		return fmt.Errorf("reconciliation: RPC %s: %d %s", method, envelope.Error.Code, envelope.Error.Message)
	}
	if err := json.Unmarshal(envelope.Result, result); err != nil {
		return fmt.Errorf("reconciliation: decode RPC result: %w", err)
	}
	return nil
}

func (c *rpcClient) latestBlock(ctx context.Context) (int64, error) {
	var raw string
	if err := c.call(ctx, "eth_blockNumber", []any{}, &raw); err != nil {
		return 0, err
	}
	return parseHexInt(raw)
}

func (c *rpcClient) logs(ctx context.Context, address string, from, to int64) ([]rpcLog, error) {
	var logs []rpcLog
	filter := map[string]any{
		"address": address, "fromBlock": hexUint(from), "toBlock": hexUint(to),
		"topics": [][]string{{"0x" + topicEscrowCreated, "0x" + topicFundsLocked,
			"0x" + topicCompletionConfirmed, "0x" + topicDisputeRaised,
			"0x" + topicEscrowReleased, "0x" + topicEscrowRefunded,
			"0x" + topicDisputeResolved, "0x" + topicEscrowSplit,
			"0x" + topicProtocolFeeCollected, "0x" + topicPayoutDeferred}},
	}
	if err := c.call(ctx, "eth_getLogs", []any{filter}, &logs); err != nil {
		return nil, err
	}
	return logs, nil
}

func parseHexInt(value string) (int64, error) {
	value = strings.TrimPrefix(value, "0x")
	n, ok := new(big.Int).SetString(value, 16)
	if !ok || !n.IsInt64() {
		return 0, fmt.Errorf("reconciliation: invalid hex integer %q", value)
	}
	return n.Int64(), nil
}

func hexUint(value int64) string {
	return "0x" + strconv.FormatInt(value, 16)
}

func word(data string, index int) ([]byte, error) {
	raw, err := hex.DecodeString(strings.TrimPrefix(data, "0x"))
	if err != nil || len(raw) < (index+1)*32 {
		return nil, errors.New("reconciliation: malformed ABI data")
	}
	return raw[index*32 : (index+1)*32], nil
}

func topicUint(topic string) (int64, error) {
	raw, err := word(topic, 0)
	if err != nil {
		return 0, err
	}
	n := new(big.Int).SetBytes(raw)
	if !n.IsInt64() {
		return 0, errors.New("reconciliation: topic integer overflow")
	}
	return n.Int64(), nil
}

func topicAddress(topic string) (string, error) {
	raw, err := word(topic, 0)
	if err != nil {
		return "", err
	}
	return "0x" + hex.EncodeToString(raw[12:]), nil
}
