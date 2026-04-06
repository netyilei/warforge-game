package bot

type TexasAction string

const (
	TexasFold  TexasAction = "fold"
	TexasCheck TexasAction = "check"
	TexasCall  TexasAction = "call"
	TexasRaise TexasAction = "raise"
	TexasAllIn TexasAction = "allin"
)

type TexasBot struct {
	BaseBot
}

func NewTexasBot(userID string, seatIndex int, chips int64, difficulty Difficulty) *TexasBot {
	return &TexasBot{
		BaseBot: BaseBot{
			UserID:     userID,
			SeatIndex:  seatIndex,
			Chips:      chips,
			Difficulty: difficulty,
		},
	}
}

func (b *TexasBot) MakeDecision(handStrength float64, potOdds float64, position int) TexasAction {
	switch b.Difficulty {
	case Easy:
		return b.easyDecision(handStrength, potOdds)
	case Medium:
		return b.mediumDecision(handStrength, potOdds, position)
	case Hard:
		return b.hardDecision(handStrength, potOdds, position)
	default:
		return TexasFold
	}
}

func (b *TexasBot) easyDecision(handStrength, potOdds float64) TexasAction {
	if handStrength > 0.7 {
		return TexasCall
	}
	if handStrength > 0.5 && potOdds < 0.3 {
		return TexasCall
	}
	return TexasFold
}

func (b *TexasBot) mediumDecision(handStrength, potOdds float64, position int) TexasAction {
	if handStrength > 0.8 {
		return TexasRaise
	}
	if handStrength > 0.6 {
		return TexasCall
	}
	if handStrength > 0.4 && potOdds < 0.25 {
		return TexasCall
	}
	return TexasFold
}

func (b *TexasBot) hardDecision(handStrength, potOdds float64, position int) TexasAction {
	positionBonus := float64(position) * 0.05
	adjustedStrength := handStrength + positionBonus

	if adjustedStrength > 0.85 {
		return TexasRaise
	}
	if adjustedStrength > 0.7 {
		return TexasCall
	}
	if adjustedStrength > 0.5 && potOdds < 0.3 {
		return TexasCall
	}
	if potOdds < 0.15 {
		return TexasCheck
	}
	return TexasFold
}
