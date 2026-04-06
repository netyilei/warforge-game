package bot

type NiuNiuAction string

const (
	NiuNiuFold  NiuNiuAction = "fold"
	NiuNiuCheck NiuNiuAction = "check"
	NiuNiuCall  NiuNiuAction = "call"
	NiuNiuRaise NiuNiuAction = "raise"
)

type NiuNiuBot struct {
	BaseBot
}

func NewNiuNiuBot(userID string, seatIndex int, chips int64, difficulty Difficulty) *NiuNiuBot {
	return &NiuNiuBot{
		BaseBot: BaseBot{
			UserID:     userID,
			SeatIndex:  seatIndex,
			Chips:      chips,
			Difficulty: difficulty,
		},
	}
}

func (b *NiuNiuBot) MakeDecision(niuLevel int, potOdds float64) NiuNiuAction {
	switch b.Difficulty {
	case Easy:
		return b.easyDecision(niuLevel, potOdds)
	case Medium:
		return b.mediumDecision(niuLevel, potOdds)
	case Hard:
		return b.hardDecision(niuLevel, potOdds)
	default:
		return NiuNiuFold
	}
}

func (b *NiuNiuBot) easyDecision(niuLevel int, potOdds float64) NiuNiuAction {
	if niuLevel >= 7 {
		return NiuNiuCall
	}
	if niuLevel >= 5 && potOdds < 0.3 {
		return NiuNiuCall
	}
	return NiuNiuFold
}

func (b *NiuNiuBot) mediumDecision(niuLevel int, potOdds float64) NiuNiuAction {
	if niuLevel >= 8 {
		return NiuNiuRaise
	}
	if niuLevel >= 6 {
		return NiuNiuCall
	}
	if niuLevel >= 4 && potOdds < 0.25 {
		return NiuNiuCall
	}
	return NiuNiuFold
}

func (b *NiuNiuBot) hardDecision(niuLevel int, potOdds float64) NiuNiuAction {
	if niuLevel >= 9 {
		return NiuNiuRaise
	}
	if niuLevel >= 7 {
		return NiuNiuCall
	}
	if niuLevel >= 5 && potOdds < 0.3 {
		return NiuNiuCall
	}
	if potOdds < 0.15 {
		return NiuNiuCheck
	}
	return NiuNiuFold
}
