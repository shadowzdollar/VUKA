package reconciliation

import (
	"strings"
	"testing"
)

func TestDecodeEscrowCreated(t *testing.T) {
	log := rpcLog{
		Topics: []string{
			"0x" + topicEscrowCreated,
			"0x" + strings.Repeat("0", 63) + "7",
			"0x" + strings.Repeat("0", 61) + "b0b",
			"0x" + strings.Repeat("0", 61) + "5a1",
		},
		Data: "0x" + strings.Repeat("0", 59) + "f4240" +
			strings.Repeat("0", 60) + "1234" +
			strings.Repeat("0", 62) + "60" +
			strings.Repeat("0", 63) + "3" + "494e56" + strings.Repeat("0", 58),
		BlockNumber: "0x10", BlockHash: "0xblock", TxHash: "0xtx", LogIndex: "0x0",
	}
	got, err := decodeLog(80002, "0xcontract", log)
	if err != nil {
		t.Fatal(err)
	}
	if got.Type != EventEscrowCreated || got.EscrowID != 7 || got.Amount != "1000000" ||
		got.TimeoutAt != 0x1234 ||
		got.InvoiceRef != "INV" {
		t.Fatalf("decoded event = %+v", got)
	}
}
