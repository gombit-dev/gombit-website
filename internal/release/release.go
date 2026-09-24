package release

import "gorm.io/gorm"

// Release is a GitHub release ingested by the webhook (webhook.go). It is the
// model-first source of truth: the gombit:"..." field policy drives the
// generated DTOs and handler (dto.gen.go / handler.gen.go — do not edit those;
// run `gombit generate`). Every field is server-set — releases arrive via the
// webhook and are edited through the admin — so none is client-writable.
type Release struct {
	gorm.Model
	Tag         string `gorm:"size:255;not null;uniqueIndex" gombit:"read,server,searchable"`
	Name        string `gorm:"size:255" gombit:"read,server,searchable"`
	Body        string `gorm:"type:text" gombit:"read,server"`
	Url         string `gorm:"size:255" gombit:"read,server"`
	PublishedAt string `gorm:"size:255" gombit:"read,server,sortable"`
	Tldr        string `gorm:"type:text" gombit:"read,server"`
	TldrStatus  string `gorm:"size:255" gombit:"read,server,filterable"`
}
