-- 修复管理员菜单父子结构
-- 创建"管理员"父菜单，包含管理员用户、角色管理、权限管理三个子菜单

-- 清理旧的权限数据
DELETE FROM admin_role_permissions 
WHERE permission_id IN (
    SELECT id FROM admin_permissions 
    WHERE code LIKE 'admin%' OR code IN ('role', 'permission')
);

DELETE FROM admin_permissions 
WHERE code LIKE 'admin%' OR code IN ('role', 'permission');

-- 插入管理员菜单权限（父子结构）
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
-- 父菜单：管理员
('70000000-0000-0000-0000-000000000100', '管理员', 'adminManagement', 'menu', NULL, '/admin-management', 'layout.base', 'carbon:user-admin', 7, 1),

-- 子菜单：管理员用户
('70000000-0000-0000-0000-000000000101', '管理员用户', 'adminManagement_user', 'menu', '70000000-0000-0000-0000-000000000100', 'user', 'view.admin', 'carbon:user-multiple', 1, 1),

-- 子菜单：角色管理
('70000000-0000-0000-0000-000000000102', '角色管理', 'adminManagement_role', 'menu', '70000000-0000-0000-0000-000000000100', 'role', 'view.role', 'carbon:user-role', 2, 1),

-- 子菜单：权限管理
('70000000-0000-0000-0000-000000000103', '权限管理', 'adminManagement_permission', 'menu', '70000000-0000-0000-0000-000000000100', 'permission', 'view.permission', 'carbon:locked', 3, 1)
ON CONFLICT (code) DO NOTHING;

-- 为超级管理员角色分配所有管理员菜单权限
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM admin_permissions 
WHERE code IN ('adminManagement', 'adminManagement_user', 'adminManagement_role', 'adminManagement_permission')
ON CONFLICT (role_id, permission_id) DO NOTHING;
