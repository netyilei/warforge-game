import Decimal from 'decimaljs'
import { md5 as _md5} from 'md5js'

export namespace npmr {
	export let decimal = Decimal
	export type type_decimal = Decimal
	export let md5 = _md5
}