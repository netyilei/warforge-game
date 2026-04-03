# 充值模块 API

## 36. charge/getenabledchargeconfigs - 获取充值配置

**请求**

```
POST /charge/getenabledchargeconfigs
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| payType | number | 是 | 支付类型：1=区块链，2=银行，3=PayPal，4=苹果卡 |

**处理逻辑**

根据 payType 返回不同的配置：
- Blockchain: chains, chainInfos
- Bank: banks, bankInfos, bankBranchInfos
- Paypal: paypals, paypalInfos
- AppleCard: appleCards

**响应**

```json
{
  "code": 0,
  "chains": [...],
  "chainInfos": [...],
  "banks": [...],
  "bankInfos": [...],
  "bankBranchInfos": [...],
  "paypals": [...],
  "paypalInfos": [...],
  "appleCards": [...]
}
```

---

## 37. charge/getenabledwithdrawconfigs - 获取提现配置

**请求**

```
POST /charge/getenabledwithdrawconfigs
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| payType | number | 是 | 支付类型：1=区块链，2=银行，3=PayPal |

**响应**

```json
{
  "code": 0,
  "chains": [...],
  "chainInfos": [...],
  "banks": [...],
  "bankInfos": [...],
  "bankBranchInfos": [...],
  "paypals": [...],
  "paypalInfos": [...]
}
```

---

## 38. charge/getchargechainaddress - 获取充值区块链地址

**请求**

```
POST /charge/getchargechainaddress
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| typeID | number | 是 | 充值类型ID |

**处理逻辑**

1. 查找启用的区块链充值配置
2. 调用链服务获取用户专属充值地址

**响应**

```json
{
  "code": 0,
  "address": "0x..."
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 配置不存在 |

---

## 39. charge/getchargeorders - 获取充值订单列表

**请求**

```
POST /charge/getchargeorders
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| statuss | array | 否 | 订单状态数组 |
| payType | number | 否 | 支付类型 |
| history | boolean | 否 | 是否历史记录模式 |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "orderID": 10001,
      "strOrderID": "10001",
      "userID": 10001,
      "payType": 1,
      "typeID": 1,
      "amount": "100",
      "itemID": 1,
      "itemCount": "100",
      "status": 0,
      "timestamp": 1234567890
    }
  ]
}
```

---

## 40. charge/getwithdraworders - 获取提现订单列表

**请求**

```
POST /charge/getwithdraworders
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| statuss | array | 否 | 订单状态数组 |
| payType | number | 否 | 支付类型 |
| history | boolean | 否 | 是否历史记录模式 |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "orderID": 10001,
      "strOrderID": "10001",
      "userID": 10001,
      "payType": 1,
      "typeID": 1,
      "amount": "100",
      "feeAmount": "1",
      "itemID": 1,
      "itemCount": "100",
      "status": 0,
      "timestamp": 1234567890
    }
  ]
}
```

---

## 41. charge/charge - 创建充值订单

**请求**

```
POST /charge/charge
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| payType | number | 是 | 支付类型：1=区块链，2=银行，3=PayPal，4=苹果卡 |
| typeID | number | 是 | 充值类型ID |
| amount | string | 条件 | 充值金额（PayPal必填） |
| tag | string | 条件 | 充值凭证tag（银行/苹果卡必填） |
| returnUrl | string | 否 | 返回URL（PayPal） |
| cancelUrl | string | 否 | 取消URL（PayPal） |

**处理逻辑**

1. 检查待处理订单数量（最多5个）
2. 使用分布式锁防止并发
3. 根据支付类型创建订单：
   - Bank: 验证凭证图片，创建待审核订单
   - Paypal: 创建PayPal订单，返回支付链接
   - AppleCard: 验证凭证图片，创建待审核订单

**响应**

```json
{
  "code": 0
}
```

**PayPal响应**

```json
{
  "code": 0,
  "paypalOrderId": "xxx",
  "status": "CREATED",
  "approveUrl": "https://xxx",
  "orderId": "10001"
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 待处理订单过多 / 充值凭证不存在 / 充值配置不存在 / 充值金额过低 / 充值金额过高 / 创建Paypal订单失败 / 充值方式不存在 |

---

## 42. charge/withdraw - 创建提现订单

**请求**

```
POST /charge/withdraw
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tradePwdMD5 | string | 是 | 交易密码MD5 |
| payType | number | 是 | 支付类型：1=区块链，2=银行，3=PayPal |
| typeID | number | 是 | 提现类型ID |
| itemID | string | 是 | 道具ID |
| itemCount | string | 是 | 道具数量 |
| blockchain.address | string | 条件 | 区块链地址（区块链提现必填） |
| bank.accountName | string | 条件 | 银行账户名（银行提现必填） |
| bank.accountNumber | string | 条件 | 银行账号（银行提现必填） |
| bank.bankName | string | 条件 | 银行名称（银行提现必填） |
| bank.branchName | string | 条件 | 银行支行（银行提现必填） |
| bank.swiftCode | string | 条件 | SWIFT代码 |
| bank.country | string | 条件 | 国家 |
| paypal.paypalAccount | string | 条件 | PayPal账号（PayPal提现必填） |

**处理逻辑**

1. 验证交易密码
2. 检查用户是否被锁定提现
3. 验证提现数量
4. 使用分布式锁防止并发
5. 根据支付类型计算手续费和实际金额
6. 创建提现订单

**响应**

```json
{
  "code": 0
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 交易密码不能为空 / 交易密码错误 / 提现已锁定 / 提现数量错误 / 区块链地址不能为空 / 银行信息不能为空 / PayPal账号不能为空 / 提现配置不存在 / 提现金额过低 / 提现金额过高 / 提现金额过低，无法支付手续费 |
