package migrations

import "database/sql"

type Migration interface {
	Version() string
	Module() string
	Up(db *sql.DB) error
	Down(db *sql.DB) error
	Seed(db *sql.DB) error
}

type BaseMigration struct {
	version string
	module  string
}

func NewBaseMigration(version, module string) *BaseMigration {
	return &BaseMigration{
		version: version,
		module:  module,
	}
}

func (m *BaseMigration) Version() string {
	return m.version
}

func (m *BaseMigration) Module() string {
	return m.module
}

func (m *BaseMigration) Down(db *sql.DB) error {
	return nil
}
