package reconciliation

import (
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"
)

func decodeLog(chainID int64, contract string, log rpcLog) (ChainEvent, error) {
	if len(log.Topics) < 2 {
		return ChainEvent{}, ErrInvalidEvent
	}
	escrowID, err := topicUint(log.Topics[1])
	if err != nil {
		return ChainEvent{}, err
	}
	block, err := parseHexInt(log.BlockNumber)
	if err != nil {
		return ChainEvent{}, err
	}
	logIndex, err := parseHexInt(log.LogIndex)
	if err != nil || logIndex > int64(^uint32(0)) {
		return ChainEvent{}, fmt.Errorf("reconciliation: invalid log index")
	}
	event := ChainEvent{
		ChainID: chainID, ContractAddress: contract, BlockNumber: block,
		BlockHash: log.BlockHash, TransactionHash: log.TxHash,
		LogIndex: int32(logIndex), EscrowID: escrowID,
	}
	topic := strings.TrimPrefix(log.Topics[0], "0x")
	switch topic {
	case topicEscrowCreated:
		if len(log.Topics) != 4 {
			return ChainEvent{}, ErrInvalidEvent
		}
		event.Type = EventEscrowCreated
		event.Buyer, err = topicAddress(log.Topics[2])
		if err != nil {
			return ChainEvent{}, err
		}
		event.Supplier, err = topicAddress(log.Topics[3])
		if err != nil {
			return ChainEvent{}, err
		}
		event.Amount, event.TimeoutAt, event.InvoiceRef, err = decodeAmountTimeoutAndString(log.Data)
	case topicFundsLocked:
		event.Type = EventFundsLocked
	case topicCompletionConfirmed:
		event.Type = EventCompletionConfirmed
		event.Actor, err = topicAddress(log.Topics[2])
	case topicDisputeRaised:
		event.Type = EventDisputeRaised
		event.Actor, err = topicAddress(log.Topics[2])
		if err == nil {
			event.Reason, err = decodeString(log.Data, 0)
		}
	case topicEscrowReleased, topicEscrowRefunded:
		event.Type = EventEscrowReleased
		if topic == topicEscrowRefunded {
			event.Type = EventEscrowRefunded
		}
		event.ReleaseTo, err = topicAddress(log.Topics[2])
	case topicDisputeResolved:
		event.Type = EventDisputeResolved
		if data, dataErr := word(log.Data, 0); dataErr == nil {
			value := data[31] == 1
			event.ReleasedToSupplier = &value
		} else {
			err = dataErr
		}
	default:
		return ChainEvent{}, fmt.Errorf("%w: %s", ErrUnknownEvent, topic)
	}
	if err != nil {
		return ChainEvent{}, err
	}
	return event, nil
}

func decodeAmountTimeoutAndString(data string) (string, int64, string, error) {
	raw, err := hex.DecodeString(strings.TrimPrefix(data, "0x"))
	if err != nil || len(raw) < 96 {
		return "", 0, "", ErrInvalidEvent
	}
	amount := new(big.Int).SetBytes(raw[:32]).String()
	timeout := new(big.Int).SetBytes(raw[32:64])
	if !timeout.IsInt64() {
		return "", 0, "", ErrInvalidEvent
	}
	invoice, err := decodeString(data, 2)
	if err != nil {
		return "", 0, "", err
	}
	return amount, timeout.Int64(), invoice, nil
}

func decodeString(data string, offsetIndex int) (string, error) {
	raw, err := hex.DecodeString(strings.TrimPrefix(data, "0x"))
	if err != nil || len(raw) < (offsetIndex+1)*32 {
		return "", ErrInvalidEvent
	}
	offset := int(new(big.Int).SetBytes(raw[offsetIndex*32 : (offsetIndex+1)*32]).Uint64())
	if offset+32 > len(raw) {
		return "", ErrInvalidEvent
	}
	length := int(new(big.Int).SetBytes(raw[offset : offset+32]).Uint64())
	if length < 0 || offset+32+length > len(raw) {
		return "", ErrInvalidEvent
	}
	return string(raw[offset+32 : offset+32+length]), nil
}
