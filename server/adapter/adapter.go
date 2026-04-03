package adapter

import (
	"github.com/heroiclabs/nakama-common/runtime"
)

func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("Adapter Module Loading...")

	logger.Info("Adapter Module Loaded!")
	return nil
}
