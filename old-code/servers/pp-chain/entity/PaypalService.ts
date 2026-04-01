import { jsonAsyncService } from "kdweb-core/lib/service/base";
import { Config } from "../config";
import { Log } from "../log";
import * as crypto from "crypto";
import { Module_ChargeOrder } from "../../pp-base-define/DM_ChargeDefine";
import { ChargeDefine } from "../../pp-base-define/ChargeDefine";
import { Rpc } from "../rpc";
import { kds } from "../../pp-base-define/GlobalMethods";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { PromoteRelationUtils } from "../../src/PromoteRelationUtils";
import Decimal from "decimal.js";

/**
 * ================================================================================================
 * PayPal 支付集成 - 业务订单ID传递指南
 * ================================================================================================
 * 
 * 【核心问题】如何在 Webhook 回调中获取到 createOrder 时传入的业务订单ID？
 * 
 * 【解决方案】PayPal 提供了三个字段用于关联业务订单：
 * 
 * 1. reference_id   - 订单级别的引用ID
 *    ✓ 用于：CHECKOUT.ORDER.* 事件（如 ORDER.APPROVED, ORDER.COMPLETED）
 *    ✓ 位置：purchase_units[0].reference_id
 *    ✗ 限制：在 PAYMENT.CAPTURE.* 事件中不可用
 * 
 * 2. custom_id      - 自定义ID（推荐使用）
 *    ✓ 用于：PAYMENT.CAPTURE.* 事件（如 CAPTURE.COMPLETED, CAPTURE.REFUNDED）
 *    ✓ 位置：在 Capture/Refund 资源的根级别
 *    ✓ 优势：可在支付捕获、退款等事件中直接获取
 * 
 * 3. invoice_id     - 发票ID
 *    ✓ 用于：PAYMENT.CAPTURE.* 事件
 *    ✓ 位置：在 Capture/Refund 资源的根级别
 *    ✓ 说明：如果你的业务有发票系统，可以使用此字段
 * 
 * 【最佳实践】同时设置 reference_id 和 custom_id
 * 
 *   创建订单时：
 *   ```typescript
 *   purchase_units: [{
 *     reference_id: orderId,  // 用于订单事件
 *     custom_id: orderId,     // 用于支付/退款事件
 *     ...
 *   }]
 *   ```
 * 
 *   在 Webhook 中获取：
 *   - CHECKOUT.ORDER.APPROVED    → resource.purchase_units[0].reference_id
 *   - CHECKOUT.ORDER.COMPLETED   → resource.purchase_units[0].reference_id
 *   - PAYMENT.CAPTURE.COMPLETED  → resource.custom_id ⭐ 最重要
 *   - PAYMENT.CAPTURE.DENIED     → resource.custom_id
 *   - PAYMENT.CAPTURE.REFUNDED   → resource.custom_id
 * 
 * 【事件流程】典型的支付流程会收到以下事件：
 * 
 *   1. 用户点击支付 → 跳转到 PayPal
 *   2. 用户授权支付 → CHECKOUT.ORDER.APPROVED ✉️
 *   3. 捕获支付     → PAYMENT.CAPTURE.COMPLETED ✉️ ⭐ 真正收款
 *   4. 订单完成     → CHECKOUT.ORDER.COMPLETED ✉️
 * 
 * ================================================================================================
 */

/**
 * PayPal 订单创建请求参数
 */
interface PaypalOrderRequest {
	/** 订单金额 */
	amount: string;
	/** 货币单位（如 USD, EUR, CNY） */
	currency: string;
	/** 
	 * 业务订单ID
	 * 
	 * 【重要】此 orderId 会被同时设置到：
	 * - purchase_units[0].reference_id  → 用于订单事件（ORDER.APPROVED, ORDER.COMPLETED）
	 * - purchase_units[0].custom_id     → 用于支付事件（CAPTURE.COMPLETED, REFUNDED）
	 * 
	 * 这样可以在所有 Webhook 事件中都能获取到业务订单ID
	 */
	orderId: string;
	/** 支付成功后的返回URL（可选，默认为 callbackHost + 'paypal/success'） */
	returnUrl?: string;
	/** 用户取消支付的返回URL（可选，默认为 callbackHost + 'paypal/cancel'） */
	cancelUrl?: string;
	/** 订单描述（可选） */
	description?: string;
}

interface PaypalOrderResponse {
	id: string;
	status: string;
	links: Array<{ href: string; rel: string; method: string }>;
	purchase_units?: Array<{
		reference_id?: string;
		amount: {
			currency_code: string;
			value: string;
		};
	}>;
}

/**
 * PayPal Webhook 资源 - 订单资源
 * 
 * 用于 CHECKOUT.ORDER.* 事件（如 APPROVED, COMPLETED）
 */
interface PaypalOrderResource {
	/** PayPal 订单ID */
	id: string;
	/** 订单状态 */
	status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
	/** 订单意图：CAPTURE=立即捕获, AUTHORIZE=授权后捕获 */
	intent: 'CAPTURE' | 'AUTHORIZE';
	/** 购买单元（通常只有一个） */
	purchase_units?: Array<{
		/** 
		 * 引用ID ⭐ 重要！
		 * 
		 * 对应 createOrder 时传入的 orderId
		 * 【用途】在订单级别的事件中获取业务订单ID
		 * 【注意】仅在 CHECKOUT.ORDER.* 事件中可用，PAYMENT.CAPTURE.* 事件中不可用
		 */
		reference_id?: string;
		/** 订单描述 */
		description?: string;
		/** 
		 * 自定义ID ⭐ 推荐！
		 * 
		 * 建议在 createOrder 时设置为业务订单ID
		 * 【优势】可在订单和支付事件中都能获取
		 */
		custom_id?: string;
		/** 发票ID */
		invoice_id?: string;
		/** 订单金额 */
		amount: {
			currency_code: string;
			value: string;
			breakdown?: {
				item_total?: { currency_code: string; value: string };
				shipping?: { currency_code: string; value: string };
				tax_total?: { currency_code: string; value: string };
			};
		};
	}>;
	/** 付款人信息 */
	payer?: {
		email_address?: string;
		payer_id?: string;
		name?: {
			given_name?: string;
			surname?: string;
		};
		address?: {
			country_code?: string;
		};
	};
	/** 创建时间 */
	create_time?: string;
	/** 更新时间 */
	update_time?: string;
	/** 相关链接 */
	links?: Array<{ href: string; rel: string; method: string }>;
}

/**
 * PayPal Webhook 资源 - 支付捕获资源
 * 
 * 用于 PAYMENT.CAPTURE.* 事件（如 COMPLETED, DENIED, REFUNDED）
 */
interface PaypalCaptureResource {
	/** 捕获ID */
	id: string;
	/** 捕获状态 */
	status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED' | 'FAILED';
	/** 支付金额 */
	amount: {
		currency_code: string;
		value: string;
	};
	/** 是否为最终捕获 */
	final_capture?: boolean;
	/** 卖家保护状态 */
	seller_protection?: {
		status: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
		dispute_categories?: Array<'ITEM_NOT_RECEIVED' | 'UNAUTHORIZED_TRANSACTION'>;
	};
	/** 
	 * 发票ID
	 * 对应 createOrder 时设置的 invoice_id
	 */
	invoice_id?: string;
	/** 
	 * 自定义ID ⭐ 重要！
	 * 
	 * 对应 createOrder 时设置的 custom_id
	 * 【推荐】用此字段存储业务订单ID，可在支付完成、退款等事件中直接获取
	 */
	custom_id?: string;
	/** 创建时间 */
	create_time?: string;
	/** 更新时间 */
	update_time?: string;
	/** 相关链接 */
	links?: Array<{ href: string; rel: string; method: string }>;
}

/**
 * PayPal Webhook 资源 - 退款资源
 * 
 * 用于 PAYMENT.CAPTURE.REFUNDED 事件
 */
interface PaypalRefundResource {
	/** 退款ID */
	id: string;
	/** 退款状态 */
	status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
	/** 退款金额 */
	amount: {
		currency_code: string;
		value: string;
	};
	/** 
	 * 发票ID
	 * 对应 createOrder 时设置的 invoice_id
	 */
	invoice_id?: string;
	/** 
	 * 自定义ID ⭐ 重要！
	 * 
	 * 对应 createOrder 时设置的 custom_id
	 * 【推荐】用此字段获取业务订单ID，以便回收商品/服务
	 */
	custom_id?: string;
	/** 创建时间 */
	create_time?: string;
	/** 更新时间 */
	update_time?: string;
	/** 相关链接 */
	links?: Array<{ href: string; rel: string; method: string }>;
}

/**
 * PayPal Webhook 事件
 * 包含事件类型和对应的资源数据
 */
interface PaypalWebhookEvent {
	/** 事件类型，如 PAYMENT.CAPTURE.COMPLETED */
	event_type: string;
	/** 
	 * 事件资源数据，根据不同的 event_type 会有不同的结构
	 * - CHECKOUT.ORDER.* 事件：PaypalOrderResource
	 * - PAYMENT.CAPTURE.* 事件：PaypalCaptureResource
	 * - PAYMENT.CAPTURE.REFUNDED 事件：PaypalRefundResource
	 */
	resource: PaypalOrderResource | PaypalCaptureResource | PaypalRefundResource;
	/** Webhook 事件唯一ID */
	id?: string;
	/** 事件创建时间 (ISO 8601 格式) */
	create_time?: string;
	/** 资源类型，如 capture、refund、checkout-order */
	resource_type?: string;
	/** 事件摘要描述 */
	summary?: string;
	/** 事件版本 */
	event_version?: string;
	/** 资源版本 */
	resource_version?: string;
}

interface PaypalCaptureResponse {
	id: string;
	status: string;
	purchase_units: Array<{
		reference_id?: string;
		description?: string;
		custom_id?: string;
		invoice_id?: string;
		soft_descriptor?: string;
		amount?: {
			currency_code: string;
			value: string;
		};
		payee?: {
			email_address?: string;
			merchant_id?: string;
		};
		payments: {
			captures: Array<{
				id: string;
				status: string;
				amount: {
					currency_code: string;
					value: string;
				};
				final_capture?: boolean;
				seller_protection?: {
					status: string;
					dispute_categories?: string[];
				};
				create_time?: string;
				update_time?: string;
			}>;
		};
	}>;
	payer?: {
		email_address?: string;
		payer_id?: string;
		name?: {
			given_name?: string;
			surname?: string;
		};
	};
	create_time?: string;
	update_time?: string;
}

export namespace PaypalService {
	/**
	 * 获取 PayPal Access Token
	 */
	async function getAccessToken(): Promise<string | null> {
		try {
			const config = Config.localConfig.paypal;
			const auth = Buffer.from(`${config.clientID}:${config.secret}`).toString('base64');
			
			const request = require('request');
			return new Promise((resolve, reject) => {
				request.post({
					url: `${config.baseUrl}/v1/oauth2/token`,
					headers: {
						'Accept': 'application/json',
						'Authorization': `Basic ${auth}`,
						'Content-Type': 'application/x-www-form-urlencoded'
					},
					form: {
						grant_type: 'client_credentials'
					}
				}, (error: any, response: any, body: any) => {
					if (error) {
						Log.oth.error('PayPal getAccessToken error:', error);
						resolve(null);
						return;
					}
					try {
						const data = JSON.parse(body);
						if (data.access_token) {
							resolve(data.access_token);
						} else {
							Log.oth.error('PayPal getAccessToken failed:', body);
							resolve(null);
						}
					} catch (e) {
						Log.oth.error('PayPal getAccessToken parse error:', e);
						resolve(null);
					}
				});
			});
		} catch (e) {
			Log.oth.error('getAccessToken exception:', e);
			return null;
		}
	}

	/**
	 * 创建 PayPal 订单
	 * 
	 * 【重要】orderId 的传递说明：
	 * 1. 创建订单时，params.orderId 会被设置到 purchase_units[0].reference_id
	 * 2. 在 Webhook 回调中可以通过以下方式获取：
	 *    - CHECKOUT.ORDER.APPROVED 事件：resource.purchase_units[0].reference_id
	 *    - CHECKOUT.ORDER.COMPLETED 事件：resource.purchase_units[0].reference_id
	 *    - PAYMENT.CAPTURE.COMPLETED 事件：需要调用 getOrderDetails(paypalOrderId) 获取原始订单，
	 *      然后从订单的 purchase_units[0].reference_id 中获取
	 * 
	 * 【建议】为了在 PAYMENT.CAPTURE.* 事件中更方便地获取业务订单ID，推荐同时设置：
	 *    - reference_id: 用于订单级别的事件（CHECKOUT.ORDER.*）
	 *    - custom_id 或 invoice_id: 用于支付级别的事件（PAYMENT.CAPTURE.*）
	 */
	export async function createOrder(params: PaypalOrderRequest): Promise<PaypalOrderResponse | null> {
		try {
			const accessToken = await getAccessToken();
			if (!accessToken) {
				Log.oth.error('Failed to get PayPal access token');
				return null;
			}

			const config = Config.localConfig.paypal;
			const request = require('request');

			const orderData = {
				intent: 'CAPTURE',
				purchase_units: [{
					// 业务订单ID - 可在订单相关的 Webhook 事件中获取
					reference_id: params.orderId,
					// 建议同时设置 custom_id，方便在支付捕获事件中直接获取
					custom_id: params.orderId,
					description: params.description || 'Purchase',
					amount: {
						currency_code: params.currency,
						value: params.amount
					}
				}],
				application_context: {
					return_url: params.returnUrl || `${Config.localConfig.paypal.returnUrl}`,
					cancel_url: params.cancelUrl || `${Config.localConfig.paypal.cancelUrl}`,
					brand_name: 'Your Brand',
					landing_page: 'NO_PREFERENCE',
					user_action: 'PAY_NOW'
				}
			};

			return new Promise((resolve, reject) => {
				request.post({
					url: `${config.baseUrl}/v2/checkout/orders`,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${accessToken}`
					},
					json: orderData
				}, (error: any, response: any, body: any) => {
					if (error) {
						Log.oth.error('PayPal createOrder error:', error);
						resolve(null);
						return;
					}
					if (response.statusCode >= 400) {
						Log.oth.error('PayPal createOrder failed:', response.statusCode, body);
						resolve(null);
						return;
					}
					Log.oth.info('PayPal order created:', body.id, params.orderId);
					resolve(body);
				});
			});
		} catch (e) {
			Log.oth.error('createOrder exception:', e);
			return null;
		}
	}

	/**
	 * 获取订单详情
	 */
	export async function getOrderDetails(paypalOrderId: string): Promise<any> {
		try {
			const accessToken = await getAccessToken();
			if (!accessToken) {
				Log.oth.error('Failed to get PayPal access token');
				return null;
			}

			const config = Config.localConfig.paypal;
			const request = require('request');

			return new Promise((resolve, reject) => {
				request.get({
					url: `${config.baseUrl}/v2/checkout/orders/${paypalOrderId}`,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${accessToken}`
					}
				}, (error: any, response: any, body: any) => {
					if (error) {
						Log.oth.error('PayPal getOrderDetails error:', error);
						resolve(null);
						return;
					}
					try {
						const data = typeof body === 'string' ? JSON.parse(body) : body;
						resolve(data);
					} catch (e) {
						Log.oth.error('PayPal getOrderDetails parse error:', e);
						resolve(null);
					}
				});
			});
		} catch (e) {
			Log.oth.error('getOrderDetails exception:', e);
			return null;
		}
	}

	/**
	 * 捕获订单支付
	 */
	export async function captureOrder(paypalOrderId: string): Promise<PaypalCaptureResponse | null> {
		try {
			const accessToken = await getAccessToken();
			if (!accessToken) {
				Log.oth.error('Failed to get PayPal access token');
				return null;
			}

			const config = Config.localConfig.paypal;
			const request = require('request');

			return new Promise((resolve, reject) => {
				request.post({
					url: `${config.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${accessToken}`
					},
					json: {}
				}, (error: any, response: any, body: any) => {
					if (error) {
						Log.oth.error('PayPal captureOrder error:', error);
						resolve(null);
						return;
					}
					if (response.statusCode >= 400) {
						Log.oth.error('PayPal captureOrder failed:', response.statusCode, body);
						resolve(null);
						return;
					}
					Log.oth.info('PayPal order captured:', paypalOrderId);
					resolve(body);
				});
			});
		} catch (e) {
			Log.oth.error('captureOrder exception:', e);
			return null;
		}
	}

	/**
	 * 验证 PayPal Webhook 签名
	 */
	export async function verifyWebhookSignature(headers: any, body: any): Promise<boolean> {
		try {
			const config = Config.localConfig.paypal;
			const accessToken = await getAccessToken();
			if (!accessToken) {
				Log.oth.error('Failed to get PayPal access token for webhook verification');
				return false;
			}

			const request = require('request');

			const verificationData = {
				auth_algo: headers['paypal-auth-algo'],
				cert_url: headers['paypal-cert-url'],
				transmission_id: headers['paypal-transmission-id'],
				transmission_sig: headers['paypal-transmission-sig'],
				transmission_time: headers['paypal-transmission-time'],
				webhook_id: Config.localConfig.paypal['webhookId'] || '', // 需要在配置中添加 webhook ID
				webhook_event: body
			};

			return new Promise((resolve) => {
				request.post({
					url: `${config.baseUrl}/v1/notifications/verify-webhook-signature`,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${accessToken}`
					},
					json: verificationData
				}, (error: any, response: any, body: any) => {
					if (error) {
						Log.oth.error('PayPal verifyWebhookSignature error:', error);
						resolve(false);
						return;
					}
					if (body && body.verification_status === 'SUCCESS') {
						resolve(true);
					} else {
						Log.oth.error('PayPal webhook verification failed:', body);
						resolve(false);
					}
				});
			});
		} catch (e) {
			Log.oth.error('verifyWebhookSignature exception:', e);
			return false;
		}
	}

	/**
	 * Webhook 服务 - 接收 PayPal 回调
	 */
	export class WebhookService extends jsonAsyncService {
		async work(params: PaypalWebhookEvent) {
			try {
				Log.oth.info('PayPal Webhook received:', JSON.stringify(params));

				// 验证 webhook 签名（生产环境必须启用）
				if (!Config.localConfig.paypal.sandbox) {
					const isValid = await verifyWebhookSignature(this.currentReq.headers, params);
					if (!isValid) {
						Log.oth.error('PayPal webhook signature verification failed');
						return { success: false, error: 'Invalid signature' };
					}
				}

				const eventType = params.event_type;
				const resource = params.resource;

			// 处理不同类型的事件
			switch (eventType) {
				case 'CHECKOUT.ORDER.APPROVED':
					// 订单已批准，可以进行捕获
					await handleOrderApproved(resource as PaypalOrderResource);
					break;

				case 'PAYMENT.CAPTURE.COMPLETED':
					// 支付已完成
					await handlePaymentCompleted(resource as PaypalCaptureResource);
					break;

				case 'PAYMENT.CAPTURE.DENIED':
					// 支付被拒绝
					await handlePaymentDenied(resource as PaypalCaptureResource);
					break;

				case 'PAYMENT.CAPTURE.REFUNDED':
					// 支付已退款
					await handlePaymentRefunded(resource as PaypalRefundResource);
					break;

				case 'CHECKOUT.ORDER.COMPLETED':
					// 订单已完成
					await handleOrderCompleted(resource as PaypalOrderResource);
					break;

				default:
					Log.oth.info('Unhandled PayPal webhook event:', eventType);
			}

				return { success: true };
			} catch (e) {
				Log.oth.error('PayPal webhook processing error:', e);
				return { success: false, error: e.message };
			}
		}
	}

	/**
	 * 处理订单已批准事件
	 * @param resource 订单资源数据
	 * 
	 * 【获取业务订单ID】：
	 * - resource.purchase_units[0].reference_id  ← createOrder 时传入的 orderId
	 * - resource.purchase_units[0].custom_id     ← createOrder 时设置的 custom_id（推荐）
	 * - resource.purchase_units[0].invoice_id    ← 如果设置了发票ID
	 */
	async function handleOrderApproved(resource: PaypalOrderResource) {
		try {
			Log.oth.info('Order approved:', resource.id, 'Status:', resource.status);
			
			// 【方式1】通过 reference_id 获取业务订单ID（createOrder 时传入的 orderId）
			const referenceId = resource.purchase_units?.[0]?.reference_id;
			
			// 【方式2】通过 custom_id 获取（推荐，更灵活）
			const customId = resource.purchase_units?.[0]?.custom_id;
			
			// 【方式3】通过 invoice_id 获取
			const invoiceId = resource.purchase_units?.[0]?.invoice_id;
			
			// 使用任一方式获取到的业务订单ID
			const businessOrderId = referenceId || customId || invoiceId;
			
			Log.oth.info('Business Order ID:', businessOrderId);
			
			// 这里可以自动捕获订单，或者等待用户确认
			const captureResult = await captureOrder(resource.id);
			let order = await Module_ChargeOrder.searchLockedSingleData(businessOrderId)
			if(!order) {
				Log.oth.error('Cannot find charge order:', businessOrderId);
				return;
			}
			if(order.data.status != ChargeDefine.ChargeStatus.Wait) {
				order.release()
				Log.oth.error('Charge order status invalid:', businessOrderId, order.data.status);
				return;
			}
			if(captureResult?.status == "COMPLETED") {
				Log.oth.info('Order captured successfully:', resource.id);
				order.data.status = ChargeDefine.ChargeStatus.Process
				order.data.reason = 'Capture successful'
			} else {
				Log.oth.error('Order capture failed:', resource.id, captureResult);
				order.data.status = ChargeDefine.ChargeStatus.Cancel
				order.data.reason = 'Capture failed'
			}
			await order.saveAndRelease()
			// TODO: 更新数据库订单状态
			// await updateOrderStatus(businessOrderId, 'approved');
		} catch (e) {
			Log.oth.error('handleOrderApproved error:', e);
		}
	}

	/**
	 * 处理支付完成事件
	 * @param resource 支付捕获资源数据
	 * 
	 * 【重要】获取业务订单ID 的方式：
	 * 
	 * ⚠️ 注意：PAYMENT.CAPTURE.* 事件中的 resource 是 Capture 对象，不包含 reference_id！
	 * 
	 * 【推荐方案】在 createOrder 时设置 custom_id，可直接从 resource 获取：
	 *   - resource.custom_id    ← 对应 createOrder 时设置的 custom_id（推荐）
	 *   - resource.invoice_id   ← 对应 createOrder 时设置的 invoice_id
	 * 
	 * 【备用方案】如果只设置了 reference_id，需要额外调用 API：
	 *   1. 从 Webhook 的 resource.supplementary_data.related_ids.order_id 获取 PayPal Order ID
	 *   2. 调用 getOrderDetails(orderId) 获取订单详情
	 *   3. 从订单的 purchase_units[0].reference_id 中获取业务订单ID
	 * 
	 * 💡 建议：在 createOrder 时同时设置 reference_id 和 custom_id，这样在所有事件中都能方便获取
	 */
	async function handlePaymentCompleted(resource: PaypalCaptureResource) {
		try {
			Log.oth.info('Payment completed:', resource.id, 'Status:', resource.status);
			
			// 从 resource 中获取支付信息
			const amount = resource.amount;
			
			// 【方案1 - 推荐】直接从 custom_id 获取业务订单ID
			const customId = resource.custom_id;
			
			// 【方案2】从 invoice_id 获取
			const invoiceId = resource.invoice_id;
			
			// 使用任一方式获取到的业务订单ID
			const businessOrderId = customId || invoiceId;
			
			if (!businessOrderId) {
				Log.oth.error('⚠️ 无法获取业务订单ID！请确保在 createOrder 时设置了 custom_id 或 invoice_id');
				// 如果没有设置 custom_id，需要通过额外的 API 调用获取
				// const orderDetails = await getOrderDetails(relatedOrderId);
				// const referenceId = orderDetails.purchase_units[0].reference_id;
			}
			
			let order = await Module_ChargeOrder.searchLockedSingleData(businessOrderId)
			if(!order) {
				Log.oth.error('Cannot find charge order:', customId);
				return;
			}
			if(order.data.status != ChargeDefine.ChargeStatus.Process) {
				order.release()
				Log.oth.error('Charge order status invalid:', businessOrderId, order.data.status);
				return;
			}
			order.data.status = ChargeDefine.ChargeStatus.Success
			order.data.reason = 'Payment completed'
			await order.saveAndRelease()
			await Rpc.center.call(kds.item.add,order.data.userID,order.data.itemID,order.data.itemCount,ItemDefine.SerialType.Charge,{
				reason: `Charge Order ${businessOrderId} completed via PayPal`,
				paypalID: resource.id
			})
			
			PromoteRelationUtils.addBalance(order.data.userID,order.data.itemID,{
				exceptionValue:order.data.itemCount,
				totalCharge:order.data.itemCount,
			},"paypal charge callback")
			PromoteRelationUtils.reportCharge(order.data.userID,order.data.itemID,order.data.itemCount,Rpc.center)

			// TODO: 更新数据库订单状态为已完成
			// await updateOrderStatus(businessOrderId, 'completed', {
			//   captureId: resource.id,
			//   amount: amount.value,
			//   currency: amount.currency_code
			// });
			
			// TODO: 发放用户购买的商品/服务
			// await deliverProduct(businessOrderId);
			
			Log.oth.info('Payment processed successfully:', {
				captureId: resource.id,
				businessOrderId: businessOrderId,
				amount: amount.value,
				currency: amount.currency_code,
				sellerProtection: resource.seller_protection?.status
			});
		} catch (e) {
			Log.oth.error('handlePaymentCompleted error:', e);
		}
	}

	/**
	 * 处理支付被拒绝事件
	 * @param resource 支付捕获资源数据
	 * 
	 * 【获取业务订单ID】：
	 * - resource.custom_id   ← createOrder 时设置的 custom_id（推荐）
	 * - resource.invoice_id  ← createOrder 时设置的 invoice_id
	 * 
	 * ⚠️ 注意：此事件不包含 reference_id，请确保在 createOrder 时设置了 custom_id
	 */
	async function handlePaymentDenied(resource: PaypalCaptureResource) {
		try {
			Log.oth.info('Payment denied:', resource.id, 'Status:', resource.status);
			
			// 从 custom_id 或 invoice_id 获取业务订单ID
			const customId = resource.custom_id;
			const invoiceId = resource.invoice_id;
			const businessOrderId = customId || invoiceId;
			
			if (!businessOrderId) {
				Log.oth.error('⚠️ 无法获取业务订单ID！请确保在 createOrder 时设置了 custom_id');
			}
			
			let order = await Module_ChargeOrder.searchLockedSingleData(businessOrderId)
			if(!order) {
				Log.oth.error('Cannot find charge order:', businessOrderId);
				return;
			}
			if(order.data.status != ChargeDefine.ChargeStatus.Process && order.data.status != ChargeDefine.ChargeStatus.Wait) {
				order.release()
				Log.oth.error('Charge order status invalid:', businessOrderId, order.data.status);
				return;
			}
			order.data.status = ChargeDefine.ChargeStatus.Cancel
			order.data.reason = 'Payment denied by PayPal'
			await order.saveAndRelease()
			Log.oth.info('Payment denied processed:', {
				captureId: resource.id,
				businessOrderId: businessOrderId
			});
			// TODO: 更新数据库订单状态为失败
			// await updateOrderStatus(businessOrderId, 'failed', {
			//   captureId: resource.id,
			//   reason: 'Payment denied by PayPal'
			// });
		} catch (e) {
			Log.oth.error('handlePaymentDenied error:', e);
		}
	}

	/**
	 * 处理支付退款事件
	 * @param resource 退款资源数据
	 * 
	 * 【获取业务订单ID】：
	 * - resource.custom_id   ← createOrder 时设置的 custom_id（推荐）
	 * - resource.invoice_id  ← createOrder 时设置的 invoice_id
	 * 
	 * ⚠️ 注意：此事件不包含 reference_id，请确保在 createOrder 时设置了 custom_id
	 */
	async function handlePaymentRefunded(resource: PaypalRefundResource) {
		try {
			Log.oth.info('Payment refunded:', resource.id, 'Status:', resource.status);
			
			const amount = resource.amount;
			
			// 从 custom_id 或 invoice_id 获取业务订单ID
			const customId = resource.custom_id;
			const invoiceId = resource.invoice_id;
			const businessOrderId = customId || invoiceId;
			
			if (!businessOrderId) {
				Log.oth.error('⚠️ 无法获取业务订单ID！请确保在 createOrder 时设置了 custom_id');
			}

			let order = await Module_ChargeOrder.searchLockedSingleData(businessOrderId)
			if(!order) {
				Log.oth.error('Cannot find charge order:', businessOrderId);
				return;
			}
			if(order.data.status != ChargeDefine.ChargeStatus.Success) {
				order.release()
				Log.oth.error('Charge order status invalid:', businessOrderId, order.data.status);
				return;
			}
			order.data.status = ChargeDefine.ChargeStatus.Refunded
			order.data.reason = 'Payment refunded by PayPal'
			await order.saveAndRelease()
			await Rpc.center.call(kds.item.use,order.data.userID,order.data.itemID,order.data.itemCount,true,ItemDefine.SerialType.ChargeRefund,{
				reason: `Charge Order ${businessOrderId} refunded via PayPal`,
				paypalID: resource.id
			})
			
			// TODO: 更新数据库订单状态为已退款
			// await updateOrderStatus(businessOrderId, 'refunded', {
			//   refundId: resource.id,
			//   amount: amount.value,
			//   currency: amount.currency_code
			// });
			
			// TODO: 回收用户的商品/服务
			// await revokeProduct(businessOrderId);
			
			Log.oth.info('Refund processed:', {
				refundId: resource.id,
				businessOrderId: businessOrderId,
				amount: amount.value,
				currency: amount.currency_code
			});
		} catch (e) {
			Log.oth.error('handlePaymentRefunded error:', e);
		}
	}

	/**
	 * 处理订单完成事件
	 * @param resource 订单资源数据
	 * 
	 * 【获取业务订单ID】：
	 * - resource.purchase_units[0].reference_id  ← createOrder 时传入的 orderId（推荐用于订单事件）
	 * - resource.purchase_units[0].custom_id     ← createOrder 时设置的 custom_id
	 * - resource.purchase_units[0].invoice_id    ← 如果设置了发票ID
	 */
	async function handleOrderCompleted(resource: PaypalOrderResource) {
		try {
			Log.oth.info('Order completed:', resource.id, 'Status:', resource.status);
			
			// 获取业务订单ID（多种方式）
			const referenceId = resource.purchase_units?.[0]?.reference_id;
			const customId = resource.purchase_units?.[0]?.custom_id;
			const invoiceId = resource.purchase_units?.[0]?.invoice_id;
			const amount = resource.purchase_units?.[0]?.amount;
			
			// 优先使用 reference_id，然后是 custom_id
			const businessOrderId = referenceId || customId || invoiceId;
			
			// TODO: 最终确认订单完成状态
			// await finalizeOrder(businessOrderId, {
			//   paypalOrderId: resource.id,
			//   amount: amount?.value,
			//   currency: amount?.currency_code
			// });
			
			Log.oth.info('Order finalized:', {
				paypalOrderId: resource.id,
				businessOrderId: businessOrderId,
				referenceId: referenceId,
				customId: customId
			});
		} catch (e) {
			Log.oth.error('handleOrderCompleted error:', e);
		}
	}

	/**
	 * 退款订单
	 */
	export async function refundCapture(captureId: string, amount?: { value: string; currency_code: string }): Promise<any> {
		try {
			const accessToken = await getAccessToken();
			if (!accessToken) {
				Log.oth.error('Failed to get PayPal access token');
				return null;
			}

			const config = Config.localConfig.paypal;
			const request = require('request');

			const refundData = amount ? { amount } : {};

			return new Promise((resolve, reject) => {
				request.post({
					url: `${config.baseUrl}/v2/payments/captures/${captureId}/refund`,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${accessToken}`
					},
					json: refundData
				}, (error: any, response: any, body: any) => {
					if (error) {
						Log.oth.error('PayPal refund error:', error);
						resolve(null);
						return;
					}
					if (response.statusCode >= 400) {
						Log.oth.error('PayPal refund failed:', response.statusCode, body);
						resolve(null);
						return;
					}
					Log.oth.info('PayPal refund successful:', captureId);
					resolve(body);
				});
			});
		} catch (e) {
			Log.oth.error('refundCapture exception:', e);
			return null;
		}
	}
}