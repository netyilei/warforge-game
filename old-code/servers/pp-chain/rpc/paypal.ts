import Decimal from "decimal.js"
import { PaypalService } from "../entity/PaypalService"
import { Log } from "../log"
import { Module_ChargeOrder } from "../../pp-base-define/DM_ChargeDefine"
import { ChargeDefine } from "../../pp-base-define/ChargeDefine"

/**
 * 创建 PayPal 订单
 * @param h 会话标识
 * @param userID 用户ID
 * @param orderId 业务订单ID
 * @param currency 货币单位 (如 USD, EUR 等)
 * @param amount 金额
 * @param description 订单描述
 */
async function createPaypalOrder(
	h: string, 
	orderId:string,
	returnUrl?:string,
	cancelUrl?:string
) {
	let order = await Module_ChargeOrder.searchLockedSingleData(orderId)
	if(!order) {
		Log.oth.error('Cannot find charge order:', orderId)
		return null
	}
	if(order.data.status != ChargeDefine.ChargeStatus.Wait) {
		order.release()
		Log.oth.error('Charge order status invalid:', orderId, order.data.status)
		return null
	}
	let amount = order.data.amount
	let currency = order.data.currencyUnit
	let description = `Charge Order ${orderId}`
	try {
		// 格式化金额为两位小数
		let value = new Decimal(amount).toDecimalPlaces(2, Decimal.ROUND_DOWN)
		
		if (value.lessThanOrEqualTo(0)) {
			Log.oth.error('Invalid PayPal amount:', order.data.userID, amount)
			return null
		}

		// 创建 PayPal 订单
		const result = await PaypalService.createOrder({
			amount: value.toString(),
			currency: currency.toUpperCase(),
			orderId: orderId,
			description: description || `Order ${orderId}`,
			returnUrl: returnUrl,
			cancelUrl: cancelUrl
		})

		if (!result) {
			Log.oth.error('Failed to create PayPal order:', order.data.userID, orderId)
			return null
		}

		// 获取支付链接
		const approveLink = result.links.find(link => link.rel === 'approve')
		
		return {
			paypalOrderId: result.id,
			status: result.status,
			approveUrl: approveLink?.href || '',
			orderId: orderId
		}
	} catch (e) {
		Log.oth.error('createPaypalOrder exception:', e)
	} finally {
		order.release()
	}
	return null
}

/**
 * 获取 PayPal 订单详情
 * @param h 会话标识
 * @param userID 用户ID
 * @param paypalOrderId PayPal订单ID
 */
async function getPaypalOrderDetails(h: string, userID: number, paypalOrderId: string) {
	try {
		const result = await PaypalService.getOrderDetails(paypalOrderId)
		if (!result) {
			Log.oth.error('Failed to get PayPal order details:', userID, paypalOrderId)
			return null
		}
		return result
	} catch (e) {
		Log.oth.error('getPaypalOrderDetails exception:', e)
		return null
	}
}

/**
 * 捕获 PayPal 订单支付
 * @param h 会话标识
 * @param userID 用户ID
 * @param paypalOrderId PayPal订单ID
 */
async function capturePaypalOrder(h: string, userID: number, paypalOrderId: string) {
	try {
		const result = await PaypalService.captureOrder(paypalOrderId)
		if (!result) {
			Log.oth.error('Failed to capture PayPal order:', userID, paypalOrderId)
			return null
		}

		// 提取支付信息
		const purchaseUnit = result.purchase_units?.[0]
		if (!purchaseUnit) {
			Log.oth.error('No purchase unit in PayPal response:', userID, paypalOrderId)
			return null
		}

		const capture = purchaseUnit.payments?.captures?.[0]
		if (!capture) {
			Log.oth.error('No capture data in PayPal response:', userID, paypalOrderId)
			return null
		}

		return {
			captureId: capture.id,
			status: capture.status,
			amount: capture.amount.value,
			currency: capture.amount.currency_code,
			orderId: purchaseUnit.reference_id || ''
		}
	} catch (e) {
		Log.oth.error('capturePaypalOrder exception:', e)
		return null
	}
}

/**
 * 退款 PayPal 支付
 * @param h 会话标识
 * @param userID 用户ID
 * @param captureId PayPal捕获ID
 * @param amount 退款金额（可选，不传则全额退款）
 * @param currency 货币单位（如果指定退款金额，必须提供）
 */
async function refundPaypalPayment(
	h: string, 
	userID: number, 
	captureId: string,
	amount?: string | number,
	currency?: string
) {
	try {
		let refundAmount = undefined
		if (amount && currency) {
			const value = new Decimal(amount).toDecimalPlaces(2, Decimal.ROUND_DOWN)
			refundAmount = {
				value: value.toString(),
				currency_code: currency.toUpperCase()
			}
		}

		const result = await PaypalService.refundCapture(captureId, refundAmount)
		if (!result) {
			Log.oth.error('Failed to refund PayPal payment:', userID, captureId)
			return null
		}

		return {
			refundId: result.id,
			status: result.status,
			amount: result.amount?.value,
			currency: result.amount?.currency_code
		}
	} catch (e) {
		Log.oth.error('refundPaypalPayment exception:', e)
		return null
	}
}

export let RpcPaypal = {
	createPaypalOrder,
	getPaypalOrderDetails,
	capturePaypalOrder,
	refundPaypalPayment
}