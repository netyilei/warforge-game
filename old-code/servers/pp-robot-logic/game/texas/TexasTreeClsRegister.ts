import { B3Abandon } from "./action/B3Abandon";
import { B3Allin } from "./action/B3Allin";
import { B3Bet } from "./action/B3Bet";
import { B3Call } from "./action/B3Call";
import { B3Raise } from "./action/B3Raise";
import { B3ReadyExit } from "./action/B3ReadyExit";
import { B3ReadyStandup } from "./action/B3ReadyStandup";
import { B3SitDown } from "./action/B3SitDown";
import { B3Random } from "./composite/B3Random";
import { B3GamePri } from "./composite/B3GamePri";
import { B3WaitSeq } from "./composite/B3WaitSeq";
import { B3CheckBalance } from "./condition/B3CheckBalance";
import { B3CheckSitDown } from "./condition/B3CheckSitDown";
import { B3IsAllin } from "./condition/B3IsAllin";
import { B3IsBet } from "./condition/B3IsBet";
import { B3IsCall } from "./condition/B3IsCall";
import { B3IsRaise } from "./condition/B3IsRaise";
import { B3IsReadyExit } from "./condition/B3IsReadyExit";
import { B3IsSendChat } from "./condition/B3IsSendChat";
import { B3SendRandChat } from "./action/B3SendRandChat";
import { B3Check } from "./action/B3Check";
import { B3IsCheck } from "./condition/B3IsCheck";
import { B3CaleScore } from "./decide/B3CaleScore";
import { B3IsEnoughScore } from "./condition/B3IsEnoughScore";
import { B3RandomSuccess } from "./decide/B3RandomSuccess";
import { B3IsMaxWinRate } from "./condition/B3IsMaxWinRate";
import { B3CheckEV } from "./condition/B3CheckEV";
import { B3IsInDesk } from "./condition/B3IsInDesk";
import { B3IsOutInterval } from "./condition/B3IsOutInterval";
import { B3CheckStandup } from "./condition/B3CheckStandup";
import { B3Buyin } from "./action/B3Buyin";
import { B3CheckPersonality } from "./condition/B3CheckPersonality";
import { B3CheckBluffAllin } from "./condition/B3CheckBluffAllin";
import { B3CheckBluff } from "./condition/B3CheckBluff";
import { B3IsOtherAllIn } from "./condition/B3IsOtherAllIn";
import { B3IsNoPlayer } from "./condition/B3IsNoPlayer";
import { B3IsFinishJuCount } from "./condition/B3IsFinshJuCount";

export let TexasTreeClsRegister =  {
    //action
    "B3Abandon": B3Abandon,
    "B3Allin": B3Allin,
    "B3Bet": B3Bet,
    "B3Call": B3Call,
    "B3Raise": B3Raise,
    "B3ReadyExit": B3ReadyExit,
    "B3ReadyStandup": B3ReadyStandup,  
    "B3SitDown": B3SitDown,
    "B3SendRandChat":B3SendRandChat,
    "B3Check":B3Check,
    "B3Buyin":B3Buyin,

    //composite
    "B3GamePri": B3GamePri,            
    "B3Random": B3Random,
    "B3WaitSeq": B3WaitSeq,      
    
    //decorator
    "B3CaleScore": B3CaleScore,
    "B3RandomSuccess":B3RandomSuccess,

    //condition
    "B3CheckBalance": B3CheckBalance,  
    "B3CheckSitDown": B3CheckSitDown,  
    "B3IsAllin": B3IsAllin,            
    "B3IsBet": B3IsBet,                
    "B3IsCall": B3IsCall,              
    "B3IsRaise": B3IsRaise,            
    "B3IsReadyExit": B3IsReadyExit,
    "B3IsSendChat": B3IsSendChat,
    "B3IsCheck": B3IsCheck,
    "B3IsEnoughScore": B3IsEnoughScore,
    "B3IsMaxWinRate": B3IsMaxWinRate,
    "B3CheckEV":B3CheckEV,
    "B3IsInDesk":B3IsInDesk,
    "B3IsOutInterval":B3IsOutInterval,
    "B3CheckStandup":B3CheckStandup,
    "B3CheckPersonality":B3CheckPersonality,
    "B3CheckBluffAllin":B3CheckBluffAllin,
    "B3CheckBluff":B3CheckBluff,
    "B3IsOtherAllIn":B3IsOtherAllIn,
    "B3IsNoPlayer":B3IsNoPlayer,
    "B3IsFinishJuCount":B3IsFinishJuCount,
}