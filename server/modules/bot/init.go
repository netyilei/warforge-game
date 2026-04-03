package bot

import (
	"github.com/heroiclabs/nakama-common/runtime"
)

func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("Bot Module Loading...")

	logger.Info("Bot Module Loaded!")
	return nil
}
