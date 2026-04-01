/**
 * 后台 Console 权限：与 pp-servers 文档「后台管理权限说明」对应
 * 根据登录返回的 roleTarget.roles 控制菜单与路由
 */

// 与 pp-base-define/UserDefine.ts RoleType 枚举值一致
export const RoleType = {
  Admin: 0,
  Config: 1,
  UserInfos: 2,
  UserConsoleRole: 3,
  UserAppRole: 4,
  FullResource: 5,
  StoreManager: 6,
  StoreType: 7,
  EditStoreType: 8,
  CreateStore: 9,
  FullItemManager: 10,
  CustomerChatManager: 11,
  CustomerChat: 12,
  Robot: 13,
  LeaderProxy: 14,
  News: 15,
  RegisterAudit: 16,
  Charge: 17,
  ChargeConfirm: 18,
  Pot: 19,
  App: 1000,
  Seller: 1001,
}

const STORAGE_KEY_ROLE_TARGET = 'roleTarget'

/**
 * 获取当前 Console 下的角色列表（数字数组）
 * @returns {number[]}
 */
export function getConsoleRoles() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ROLE_TARGET)
    if (!raw) return []
    const data = JSON.parse(raw)
    const roles = data?.roles
    return Array.isArray(roles) ? roles : []
  } catch {
    return []
  }
}

/**
 * 是否拥有指定角色（Admin 视为拥有所有角色）
 * @param {number} role - RoleType 枚举值
 * @param {number[]} [roles] - 不传则从 sessionStorage 读取
 * @returns {boolean}
 */
export function hasRole(role, roles = null) {
  const r = roles ?? getConsoleRoles()
  if (r.includes(RoleType.Admin)) return true
  return r.includes(role)
}

/**
 * 是否拥有给定角色中的任意一个
 * @param {number[]} needRoles - 需要的角色列表（任一即可）
 * @param {number[]} [roles] - 不传则从 sessionStorage 读取
 * @returns {boolean}
 */
export function hasAnyRole(needRoles, roles = null) {
  if (!needRoles || needRoles.length === 0) return true
  const r = roles ?? getConsoleRoles()
  if (r.includes(RoleType.Admin)) return true
  return needRoles.some((role) => r.includes(role))
}

/**
 * 根据导航项配置的 roles 过滤：无 roles 则对所有人可见，有 roles 则需拥有其一
 * @param {Array} navItems - 导航项列表，项可有 roles: number[]
 * @param {number[]} [roles] - 不传则从 sessionStorage 读取
 * @returns {Array} 过滤后的导航项（会浅拷贝并过滤子项）
 */
export function filterNavByRoles(navItems, roles = null) {
  const r = roles ?? getConsoleRoles()
  if (!navItems || !navItems.length) return []

  const filtered = navItems
    .map((item) => {
      if (item.items) {
        const filteredChildren = filterNavByRoles(item.items, r)
        if (filteredChildren.length === 0) return null
        return { ...item, items: filteredChildren }
      }
      if (!item.roles || item.roles.length === 0 || item.roles.includes(RoleType.Admin)) return item
      return hasAnyRole(item.roles, r) ? item : null
    })
    .filter(Boolean)

  // 去掉没有子链接的标题（仅保留 CNavTitle 且其后无任何可点击项直到下一个标题）
  const result = []
  for (let i = 0; i < filtered.length; i++) {
    const item = filtered[i]
    const isTitle = item.component === 'CNavTitle' || !item.to
    if (!isTitle) {
      result.push(item)
      continue
    }
    let hasLinkAfter = false
    for (let j = i + 1; j < filtered.length; j++) {
      if (filtered[j].component === 'CNavTitle' || !filtered[j].to) break
      hasLinkAfter = true
      break
    }
    if (hasLinkAfter) result.push(item)
  }
  return result
}
