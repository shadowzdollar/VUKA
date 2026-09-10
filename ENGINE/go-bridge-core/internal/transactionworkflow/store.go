package transactionworkflow

import (
	"context"
	"sort"
	"sync"
	"time"
)

type MemoryStore struct {
	mu       sync.Mutex
	items    map[string]Workflow
	byKey    map[string]string
	events   map[string][]Event
	eventSeq map[string]int64
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: make(map[string]Workflow), byKey: make(map[string]string), events: make(map[string][]Event), eventSeq: make(map[string]int64)}
}

func (s *MemoryStore) Create(_ context.Context, item Workflow) (Workflow, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if id, ok := s.byKey[item.IdempotencyKey]; ok {
		return s.items[id], true, nil
	}
	s.items[item.ID] = item
	s.byKey[item.IdempotencyKey] = item.ID
	return item, false, nil
}

func (s *MemoryStore) Get(_ context.Context, id string) (Workflow, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	item, ok := s.items[id]
	if !ok {
		return Workflow{}, ErrNotFound
	}
	return item, nil
}

func (s *MemoryStore) Update(_ context.Context, item Workflow) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[item.ID]; !ok {
		return ErrNotFound
	}
	item.UpdatedAt = time.Now().UTC()
	s.items[item.ID] = item
	return nil
}

func (s *MemoryStore) AppendEvent(_ context.Context, event Event) (Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.eventSeq[event.WorkflowID]++
	event.Sequence = s.eventSeq[event.WorkflowID]
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}
	s.events[event.WorkflowID] = append(s.events[event.WorkflowID], event)
	return event, nil
}

func (s *MemoryStore) UpdateWithEvent(_ context.Context, item Workflow, event Event) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[item.ID]; !ok {
		return ErrNotFound
	}
	item.UpdatedAt = time.Now().UTC()
	s.items[item.ID] = item
	s.eventSeq[event.WorkflowID]++
	event.Sequence = s.eventSeq[event.WorkflowID]
	event.CreatedAt = time.Now().UTC()
	s.events[event.WorkflowID] = append(s.events[event.WorkflowID], event)
	return nil
}

func (s *MemoryStore) ListEvents(_ context.Context, workflowID string) ([]Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := append([]Event(nil), s.events[workflowID]...)
	sort.Slice(out, func(i, j int) bool { return out[i].Sequence < out[j].Sequence })
	return out, nil
}
