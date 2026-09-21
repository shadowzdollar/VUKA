package adapters

// liveProvider presents a real network adapter under a catalog provider id
// (e.g. "mtn-ug") and marks it as a live integration. The vendor adapters
// return fixed names ("mtn-momo-api") and their own environment strings, which
// would otherwise collide across countries and defeat the catalog's
// name/environment consistency check.
type liveProvider struct {
	ProviderAdapter
	id string
}

// WrapLive registers inner as the live rail for provider id.
func WrapLive(id string, inner ProviderAdapter) ProviderAdapter {
	return &liveProvider{ProviderAdapter: inner, id: id}
}

func (l *liveProvider) Name() string        { return l.id }
func (l *liveProvider) Environment() string { return "live" }
