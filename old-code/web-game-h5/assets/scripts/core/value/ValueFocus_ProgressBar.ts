import ValueFocus, { ValueFocusDecorator_FocusSetup } from "./ValueFocus"


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("kcore/ValueFocus_ProgressBar")
export default class ValueFocus_ProgressBar extends ValueFocus {
	@ValueFocusDecorator_FocusSetup(cc.ProgressBar,"progress")
	barValue:number = 0
}