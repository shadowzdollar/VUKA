package support

import (
	"context"
	_ "embed"
	"fmt"
)

//go:embed schema.sql
var schemaSQL string

func (s *Service) EnsureSchema(ctx context.Context) error {
	if s.pool == nil {
		return fmt.Errorf("support: EnsureSchema called with nil pool")
	}
	if _, err := s.pool.Exec(ctx, schemaSQL); err != nil {
		return fmt.Errorf("support: ensure schema: %w", err)
	}
	return nil
}
