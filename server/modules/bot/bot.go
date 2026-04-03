package bot

type Difficulty string

const (
	Easy   Difficulty = "easy"
	Medium Difficulty = "medium"
	Hard   Difficulty = "hard"
)

type Bot interface {
	GetUserID() string
	GetSeatIndex() int
	GetChips() int64
	SetChips(chips int64)
}

type BaseBot struct {
	UserID     string
	SeatIndex  int
	Chips      int64
	Difficulty Difficulty
}

func (b *BaseBot) GetUserID() string    { return b.UserID }
func (b *BaseBot) GetSeatIndex() int    { return b.SeatIndex }
func (b *BaseBot) GetChips() int64      { return b.Chips }
func (b *BaseBot) SetChips(chips int64) { b.Chips = chips }
