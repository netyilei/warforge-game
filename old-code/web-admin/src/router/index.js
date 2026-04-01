import { h, resolveComponent } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import DefaultLayout from '@/layouts/DefaultLayout'
import { hasAnyRole, RoleType } from '@/utils/permission'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () =>
          import(
            /* webpackChunkName: "dashboard" */ '@/views/dashboard/Dashboard.vue'
          ),
      },
      {
        path: '/theme',
        name: 'Theme',
        redirect: '/theme/typography',
      },
      {
        path: '/theme/colors',
        name: 'Colors',
        component: () => import('@/views/theme/Colors.vue'),
      },
      {
        path: '/theme/typography',
        name: 'Typography',
        component: () => import('@/views/theme/Typography.vue'),
      },
      {
        path: '/base',
        name: 'Base',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        redirect: '/base/breadcrumbs',
        children: [
          {
            path: '/base/accordion',
            name: 'Accordion',
            component: () => import('@/views/base/Accordion.vue'),
          },
          {
            path: '/base/breadcrumbs',
            name: 'Breadcrumbs',
            component: () => import('@/views/base/Breadcrumbs.vue'),
          },
          {
            path: '/base/cards',
            name: 'Cards',
            component: () => import('@/views/base/Cards.vue'),
          },
          {
            path: '/base/carousels',
            name: 'Carousels',
            component: () => import('@/views/base/Carousels.vue'),
          },
          {
            path: '/base/collapses',
            name: 'Collapses',
            component: () => import('@/views/base/Collapses.vue'),
          },
          {
            path: '/base/list-groups',
            name: 'List Groups',
            component: () => import('@/views/base/ListGroups.vue'),
          },
          {
            path: '/base/navs',
            name: 'Navs',
            component: () => import('@/views/base/Navs.vue'),
          },
          {
            path: '/base/paginations',
            name: 'Paginations',
            component: () => import('@/views/base/Paginations.vue'),
          },
          {
            path: '/base/placeholders',
            name: 'Placeholders',
            component: () => import('@/views/base/Placeholders.vue'),
          },
          {
            path: '/base/popovers',
            name: 'Popovers',
            component: () => import('@/views/base/Popovers.vue'),
          },
          {
            path: '/base/progress',
            name: 'Progress',
            component: () => import('@/views/base/Progress.vue'),
          },
          {
            path: '/base/spinners',
            name: 'Spinners',
            component: () => import('@/views/base/Spinners.vue'),
          },
          {
            path: '/base/tables',
            name: 'Tables',
            component: () => import('@/views/base/Tables.vue'),
          },
          {
            path: '/base/tabs',
            name: 'Tabs',
            component: () => import('@/views/base/Tabs.vue'),
          },
          {
            path: '/base/tooltips',
            name: 'Tooltips',
            component: () => import('@/views/base/Tooltips.vue'),
          },
        ],
      },
      {
        path: '/buttons',
        name: 'Buttons',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        redirect: '/buttons/standard-buttons',
        children: [
          {
            path: '/buttons/standard-buttons',
            name: 'Button Component',
            component: () => import('@/views/buttons/Buttons.vue'),
          },
          {
            path: '/buttons/dropdowns',
            name: 'Dropdowns',
            component: () => import('@/views/buttons/Dropdowns.vue'),
          },
          {
            path: '/buttons/button-groups',
            name: 'Button Groups',
            component: () => import('@/views/buttons/ButtonGroups.vue'),
          },
        ],
      },
      {
        path: '/forms',
        name: 'Forms',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        redirect: '/forms/form-control',
        children: [
          {
            path: '/forms/form-control',
            name: 'Form Control',
            component: () => import('@/views/forms/FormControl.vue'),
          },
          {
            path: '/forms/select',
            name: 'Select',
            component: () => import('@/views/forms/Select.vue'),
          },
          {
            path: '/forms/checks-radios',
            name: 'Checks & Radios',
            component: () => import('@/views/forms/ChecksRadios.vue'),
          },
          {
            path: '/forms/range',
            name: 'Range',
            component: () => import('@/views/forms/Range.vue'),
          },
          {
            path: '/forms/input-group',
            name: 'Input Group',
            component: () => import('@/views/forms/InputGroup.vue'),
          },
          {
            path: '/forms/floating-labels',
            name: 'Floating Labels',
            component: () => import('@/views/forms/FloatingLabels.vue'),
          },
          {
            path: '/forms/layout',
            name: 'Layout',
            component: () => import('@/views/forms/Layout.vue'),
          },
          {
            path: '/forms/validation',
            name: 'Validation',
            component: () => import('@/views/forms/Validation.vue'),
          },
        ],
      },
      {
        path: '/charts',
        name: 'Charts',
        component: () => import('@/views/charts/Charts.vue'),
      },
      {
        path: '/icons',
        name: 'Icons',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        redirect: '/icons/coreui-icons',
        children: [
          {
            path: '/icons/coreui-icons',
            name: 'CoreUI Icons',
            component: () => import('@/views/icons/CoreUIIcons.vue'),
          },
          {
            path: '/icons/brands',
            name: 'Brands',
            component: () => import('@/views/icons/Brands.vue'),
          },
          {
            path: '/icons/flags',
            name: 'Flags',
            component: () => import('@/views/icons/Flags.vue'),
          },
        ],
      },
      {
        path: '/notifications',
        name: 'Notifications',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        redirect: '/notifications/alerts',
        children: [
          {
            path: '/notifications/alerts',
            name: 'Alerts',
            component: () => import('@/views/notifications/Alerts.vue'),
          },
          {
            path: '/notifications/badges',
            name: 'Badges',
            component: () => import('@/views/notifications/Badges.vue'),
          },
          {
            path: '/notifications/modals',
            name: 'Modals',
            component: () => import('@/views/notifications/Modals.vue'),
          },
          {
            path: '/notifications/toasts',
            name: 'Toasts',
            component: () => import('@/views/notifications/Toasts.vue'),
          },
        ],
      },
      {
        path: '/widgets',
        name: 'Widgets',
        component: () => import('@/views/widgets/Widgets.vue'),
      },
      {
        path: '/admin',
        name: 'Admin',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        redirect: '/admin/users',
        children: [
          {
            path: '/admin/users',
            name: 'UserManagement_FilterNormalUser',
            component: () => import('@/views/admin/users/UserManagement_FilterNormalUser.vue'),
            meta: { roles: [RoleType.UserInfos] },
          },
          {
            path: '/admin/proxyusers',
            name: 'UserManagement_FilterProxyUser',
            component: () => import('@/views/admin/users/UserManagement_FilterProxyUser.vue'),
            meta: { roles: [RoleType.UserInfos] },
          },
          {
            path: '/admin/adminusers',
            name: 'UserManagement_FilterAdminUser',
            component: () => import('@/views/admin/users/UserManagement_FilterAdminUser.vue'),
            meta: { roles: [RoleType.Admin] },
          },
          {
            path: '/admin/robotusers',
            name: 'UserManagement_FilterRobotUser',
            component: () => import('@/views/admin/users/UserManagement_FilterRobotUser.vue'),
            meta: { roles: [RoleType.Robot] },
          },
          {
            path: '/admin/users/serial',
            name: 'UserSerial',
            component: () => import('@/views/admin/users/UserSerial.vue'),
            meta: { roles: [RoleType.LeaderProxy] },
          },
          {
            path: '/admin/users/register-audit',
            name: 'RegisterAudit',
            component: () => import('@/views/admin/users/RegisterAudit.vue'),
            meta: { roles: [RoleType.RegisterAudit] },
          },
          {
            path: '/admin/config/global',
            name: 'GlobalConfig',
            component: () => import('@/views/admin/config/GlobalConfig.vue'),
            meta: { roles: [RoleType.Config] },
          },
          {
            path: '/admin/config/login',
            name: 'LoginConfig',
            component: () => import('@/views/admin/config/LoginConfig.vue'),
            meta: { roles: [RoleType.Config] },
          },
          {
            path: '/admin/config/item',
            name: 'ItemConfig',
            component: () => import('@/views/admin/config/ItemConfig.vue'),
          },
          {
            path: '/admin/config/water',
            name: 'WaterConfig',
            component: () => import('@/views/admin/config/WaterConfig.vue'),
          },
          {
            path: '/admin/config/charge-reward',
            name: 'ChargeRewardConfig',
            component: () => import('@/views/admin/config/ChargeRewardConfig.vue'),
          },
          {
            path: '/admin/groups',
            name: 'GroupManagement',
            component: () => import('@/views/admin/groups/GroupManagement.vue'),
          },
          {
            path: '/admin/rooms',
            name: 'RoomManagement',
            component: () => import('@/views/admin/rooms/RoomManagement.vue'),
          },
          {
            path: '/admin/matches',
            name: 'MatchManagement',
            component: () => import('@/views/admin/matches/MatchManagement.vue'),
          },
          {
            path: '/admin/news',
            name: 'NewsManagement',
            component: () => import('@/views/admin/news/NewsManagement.vue'),
            meta: { roles: [RoleType.News] },
          },
          {
            path: '/admin/news/banners',
            name: 'BannerManagement',
            component: () => import('@/views/admin/news/BannerManagement.vue'),
            meta: { roles: [RoleType.News] },
          },
          {
            path: '/admin/robot',
            name: 'RobotManagement',
            component: () => import('@/views/admin/robot/RobotManagement.vue'),
            meta: { roles: [RoleType.Robot] },
          },
          {
            path: '/admin/chat',
            name: 'Chat',
            component: () => import('@/views/admin/chat/Chat.vue'),
            meta: { roles: [RoleType.CustomerChatManager, RoleType.CustomerChat] },
          },
          {
            path: '/admin/mail',
            name: 'MailManagement',
            component: () => import('@/views/admin/mail/MailManagement.vue'),
          },
          {
            path: '/admin/charge/chains',
            name: 'ChainInfoManagement',
            component: () => import('@/views/admin/charge/ChainInfoManagement.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/banks',
            name: 'BankInfoManagement',
            component: () => import('@/views/admin/charge/BankInfoManagement.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/bank-branches',
            name: 'BankBranchManagement',
            component: () => import('@/views/admin/charge/BankBranchManagement.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/paypal',
            name: 'PaypalInfoManagement',
            component: () => import('@/views/admin/charge/PaypalInfoManagement.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/config-bank',
            name: 'ChargeConfigBank',
            component: () => import('@/views/admin/charge/ChargeConfigBank.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/config-blockchain',
            name: 'ChargeConfigBlockchain',
            component: () => import('@/views/admin/charge/ChargeConfigBlockchain.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/config-paypal',
            name: 'ChargeConfigPaypal',
            component: () => import('@/views/admin/charge/ChargeConfigPaypal.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/config-applecard',
            name: 'ChargeConfigAppleCard',
            component: () => import('@/views/admin/charge/ChargeConfigAppleCard.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/withdraw-config-bank',
            name: 'WithdrawConfigBank',
            component: () => import('@/views/admin/charge/WithdrawConfigBank.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/withdraw-config-blockchain',
            name: 'WithdrawConfigBlockchain',
            component: () => import('@/views/admin/charge/WithdrawConfigBlockchain.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/withdraw-config-paypal',
            name: 'WithdrawConfigPaypal',
            component: () => import('@/views/admin/charge/WithdrawConfigPaypal.vue'),
            meta: { roles: [RoleType.Charge] },
          },
          {
            path: '/admin/charge/orders',
            name: 'ChargeConfirm',
            component: () => import('@/views/admin/charge/ChargeConfirm.vue'),
            meta: { roles: [RoleType.ChargeConfirm] },
          },
          {
            path: '/admin/charge/pot',
            name: 'PotManagement',
            component: () => import('@/views/admin/charge/PotManagement.vue'),
            meta: { roles: [RoleType.Pot] },
          },
          {
            path: '/admin/charge/withdraw-chain-main-address',
            name: 'WithdrawChainMainAddressManagement',
            component: () => import('@/views/admin/charge/WithdrawChainMainAddressManagement.vue'),
            meta: { roles: [RoleType.Charge] },
          },
        ],
      },
    ],
  },
  {
    path: '/pages',
    redirect: '/pages/404',
    name: 'Pages',
    component: {
      render() {
        return h(resolveComponent('router-view'))
      },
    },
    children: [
      {
        path: '404',
        name: 'Page404',
        component: () => import('@/views/pages/Page404'),
      },
      {
        path: '500',
        name: 'Page500',
        component: () => import('@/views/pages/Page500'),
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/pages/Login'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/pages/Register'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    // always scroll to top
    return { top: 0 }
  },
})

// 路由守卫：检查登录状态与权限
router.beforeEach((to, from, next) => {
  if (to.name === 'Login' || to.name === 'Register') {
    next()
    return
  }
  const ak = sessionStorage.getItem('ak')
  if (!ak) {
    next('/pages/login')
    return
  }
  const roles = to.meta?.roles
  if (roles && Array.isArray(roles) && roles.length > 0 && !hasAnyRole(roles)) {
    next('/dashboard')
    return
  }
  next()
})

export default router
