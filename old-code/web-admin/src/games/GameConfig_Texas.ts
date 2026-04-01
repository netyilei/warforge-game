/**
 * 德州扑克游戏配置
 * 根据 cpp-servers/pp-game-texas/TexasDefine.ts 中的 TexasRule 定义生成
 * 
 * Group 规则对应关系：
 * - Group0: ANTE (1 << 0), DoubleBB (1 << 1), Straddle (1 << 2)
 * - Group1: Long (1 << 0), Short (1 << 1)
 * - Group4: LastSeconds (持续秒数)
 * - Group5: ANTE (底注数值)
 * - Group6: SBlind (小盲数值)
 * - Group7: MinBuyin (最小买入)
 * - Group8: MaxBuyin (最大买入)
 */
export const GameConfig_Texas = {
  gameID: 101,
  name: "德州扑克",
  lobby_setting: {
    water: true,
    user_count: [8],
    user_count_title: "人数",
    user_count_default: 8,
    base_score: [1, 2, 3, 5],
    base_score_title: "底分",
    extension: [
      {
        key: "hu_kind",
        type: "normal",
        title: "玩法",
        names: ["底注", "双大盲", "抓位"], // 对应 Group0_ANTE, Group0_DoubleBB, Group0_Straddle
        group: 0,
        defaults: [1] // 默认选中"底注" (index 0)
      },
      {
        key: "hu_kind",
        type: "mutex",
        title: "牌型",
        names: ["长牌", "短牌"], // 对应 Group1_Long, Group1_Short
        group: 1,
        defaults: [1] // 默认选中"长牌" (index 0)
      },
      {
        key: "hu_kind",
        type: "time",
        title: "持续时长",
        names: [],
        group: 4, // Group4_LastSeconds
        defaults: [30] // 默认30秒
      },
      {
        key: "hu_kind",
        type: "int",
        title: "底注",
        names: [],
        group: 5, // Group5_ANTE
        defaults: [1]
      },
      {
        key: "hu_kind",
        type: "int",
        title: "小盲",
        names: [],
        group: 6, // Group6_SBlind
        defaults: [2]
      },
      {
        key: "hu_kind",
        type: "int",
        title: "最小买入",
        names: [],
        group: 7, // Group7_MinBuyin
        defaults: [100]
      },
      {
        key: "hu_kind",
        type: "int",
        title: "最大买入",
        names: [],
        group: 8, // Group8_MaxBuyin
        defaults: [2000]
      },
    ],
  }
}

