package hooks

import (
	"github.com/heroiclabs/nakama-common/runtime"
)

func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("Hooks Module Loading...")

	logger.Info("Hooks Module Loaded!")
	return nil
}
