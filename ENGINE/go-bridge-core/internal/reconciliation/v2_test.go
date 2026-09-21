package reconciliation

import (
	"encoding/hex"
	"errors"
	"strings"
	"testing"

	"golang.org/x/crypto/sha3"
)

func keccakHex(sig string) string {
	h := sha3.NewLegacyKeccak256()
	h.Write([]byte(sig))
	return hex.EncodeToString(h.Sum(nil))
}

// Every topic constant must be the keccak256 of the contract's event signature;
// a typo here would make the indexer silently ignore that event forever.
func TestTopicConstantsMatchEventSignatures(t *testing.T) {
	for sig, want := range map[string]string{
		"EscrowCreated(uint256,address,address,uint256,uint256,string)": topicEscrowCreated,
		"FundsLocked(uint256)":                          topicFundsLocked,
		"CompletionConfirmed(uint256,address)":          topicCompletionConfirmed,
		"DisputeRaised(uint256,address,string)":         topicDisputeRaised,
		"EscrowReleased(uint256,address)":               topicEscrowReleased,
		"EscrowRefunded(uint256,address)":               topicEscrowRefunded,
		"DisputeResolved(uint256,bool)":                 topicDisputeResolved,
		"EscrowSplit(uint256,uint256,uint256,uint256)":  topicEscrowSplit,
		"ProtocolFeeCollected(uint256,address,uint256)": topicProtocolFeeCollected,
		"PayoutDeferred(uint256,address,uint256)":       topicPayoutDeferred,
	} {
		if got := keccakHex(sig); got != want {
			t.Errorf("%s: constant %s, keccak256 is %s", sig, want, got)
		}
	}
}

func word32(n uint64) string {
	return strings.Repeat("0", 48) + hex.EncodeToString([]byte{byte(n >> 56), byte(n >> 48), byte(n >> 40), byte(n >> 32), byte(n >> 24), byte(n >> 16), byte(n >> 8), byte(n)})
}

func topicWord(hexTail string) string { return "0x" + strings.Repeat("0", 64-len(hexTail)) + hexTail }

func TestDecodeV2SplitFeeAndDeferredEvents(t *testing.T) {
	base := rpcLog{BlockNumber: "0x10", BlockHash: "0xb", TxHash: "0xtx", LogIndex: "0x1"}

	split := base
	split.Topics = []string{"0x" + topicEscrowSplit, topicWord("7")}
	split.Data = "0x" + word32(6965) + word32(3000) + word32(35)
	got, err := decodeLog(80002, "0xc", split)
	if err != nil || got.Type != EventEscrowSplit || got.SupplierAmount != "6965" || got.BuyerAmount != "3000" || got.FeeAmount != "35" {
		t.Fatalf("split = %+v, %v", got, err)
	}

	fee := base
	fee.Topics = []string{"0x" + topicProtocolFeeCollected, topicWord("7"), topicWord("7e45")}
	fee.Data = "0x" + word32(35)
	got, err = decodeLog(80002, "0xc", fee)
	if err != nil || got.Type != EventProtocolFee || got.FeeAmount != "35" || got.FeeTo != "0x000000000000000000000000000000000000"+"7e45" {
		t.Fatalf("fee = %+v, %v", got, err)
	}

	def := base
	def.Topics = []string{"0x" + topicPayoutDeferred, topicWord("7"), topicWord("51")}
	def.Data = "0x" + word32(950)
	got, err = decodeLog(80002, "0xc", def)
	if err != nil || got.Type != EventPayoutDeferred || got.Amount != "950" || !strings.HasSuffix(got.Beneficiary, "51") {
		t.Fatalf("deferred = %+v, %v", got, err)
	}

	bad := base
	bad.Topics = []string{"0x" + topicProtocolFeeCollected, topicWord("7")} // missing indexed treasury
	if _, err := decodeLog(80002, "0xc", bad); !errors.Is(err, ErrInvalidEvent) {
		t.Fatalf("malformed fee event error = %v", err)
	}
}

func lockedEscrow(t *testing.T) Escrow {
	t.Helper()
	var item Escrow
	created := event(EventEscrowCreated)
	created.Buyer, created.Supplier, created.Amount, created.TimeoutAt = "0xb", "0xs", "1000", 1
	for _, e := range []ChainEvent{created, event(EventFundsLocked)} {
		if err := Apply(&item, e); err != nil {
			t.Fatal(err)
		}
	}
	return item
}

func TestV2SplitSettlementFollowsADispute(t *testing.T) {
	item := lockedEscrow(t)
	for _, typ := range []EventType{EventDisputeRaised, EventEscrowSplit, EventProtocolFee, EventPayoutDeferred, EventDisputeResolved} {
		if err := Apply(&item, event(typ)); err != nil {
			t.Fatalf("%s: %v", typ, err)
		}
	}
	if item.State != StateSplit {
		t.Fatalf("state = %s, want SPLIT", item.State)
	}
	// Terminal: nothing further may change it.
	if err := Apply(&item, event(EventEscrowReleased)); !errors.Is(err, ErrInvalidState) {
		t.Fatalf("release after split = %v, want invalid state", err)
	}
}

func TestV2TimeoutRefundFromLockedIsValid(t *testing.T) {
	item := lockedEscrow(t)
	if err := Apply(&item, event(EventEscrowRefunded)); err != nil {
		t.Fatalf("timeout refund from LOCKED rejected: %v", err)
	}
	if item.State != StateRefunded {
		t.Fatalf("state = %s", item.State)
	}
}

func TestInformationalV2EventsNeedATerminalState(t *testing.T) {
	item := lockedEscrow(t)
	for _, typ := range []EventType{EventProtocolFee, EventPayoutDeferred} {
		if err := Apply(&item, event(typ)); !errors.Is(err, ErrInvalidState) {
			t.Fatalf("%s while LOCKED = %v, want invalid state", typ, err)
		}
	}
}
