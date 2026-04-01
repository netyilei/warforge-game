export default [
  {
    component: 'CNavTitle',
    name: '用户管理',
  },
  {
    component: 'CNavItem',
    name: '我的信息',
    to: '/admin/myinfo',
    icon: 'cil-people',
  },
  {
    component: 'CNavItem',
    name: '用户列表',
    to: '/admin/users',
    icon: 'cil-user',
  },
  {
    component: 'CNavItem',
    name: '用户流水',
    to: '/admin/users/serial',
    icon: 'cil-list',
  },
]
