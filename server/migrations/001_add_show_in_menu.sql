-- ============================================================
-- WarForge Admin Migration: Add show_in_menu to admin_permissions
-- ============================================================
-- 版本: 001
-- 描述: 添加 show_in_menu 字段，用于控制菜单是否显示在左侧导航
-- 日期: 2024-01-XX
-- ============================================================

-- 添加 show_in_menu 字段
ALTER TABLE admin_permissions 
ADD COLUMN IF NOT EXISTS show_in_menu BOOLEAN DEFAULT TRUE;

-- 为现有菜单类型的数据设置默认值
UPDATE admin_permissions 
SET show_in_menu = TRUE 
WHERE type = 'menu' AND show_in_menu IS NULL;

-- 为按钮类型的数据设置 show_in_menu = FALSE
UPDATE admin_permissions 
SET show_in_menu = FALSE 
WHERE type = 'button';

-- 添加注释
COMMENT ON COLUMN admin_permissions.show_in_menu IS '是否显示在左侧菜单中，仅对 type=menu 有效';

-- ============================================================
-- 说明：
-- 
-- show_in_menu 字段用途：
-- 1. TRUE: 显示在左侧菜单中（默认）
-- 2. FALSE: 不显示在左侧菜单中（隐藏页面，通过其他页面跳转进入）
-- 
-- type 字段说明：
-- 1. menu: 菜单项，可以有子菜单
-- 2. button: 按钮权限，用于控制页面内操作按钮的显示
-- 3. api: API权限，用于接口级别控制（可选）
-- 
-- 示例场景：
-- - 隐藏页面：订单详情页不需要显示在菜单中，但需要路由访问权限
-- - 按钮权限：编辑按钮、删除按钮等，不显示在菜单中
-- ============================================================
