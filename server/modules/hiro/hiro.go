package hiro

import (
	"github.com/heroiclabs/nakama-common/runtime"
)

func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("Hiro Module Loading...")

	logger.Info("Hiro Module Loaded!")
	return nil
}
