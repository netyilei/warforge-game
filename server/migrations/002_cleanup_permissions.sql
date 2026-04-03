-- 清理权限表，只保留仪表盘权限
-- 先删除所有菜单权限的关联
DELETE FROM admin_role_permissions WHERE permission_id IN (
    SELECT id FROM admin_permissions WHERE type = 'menu' AND code != 'home'
);

-- 删除不存在的菜单权限
DELETE FROM admin_permissions WHERE type = 'menu' AND code != 'home';

-- 确保 home 权限存在
INSERT INTO admin_permissions (
    id, name, code, type, parent_id, path, component, icon, sort_order, status
) VALUES (
    '10000000-0000-0000-0000-000000000000',
    '仪表盘',
    'home',
    'menu',
    NULL,
    '/home',
    'layout.base$view.home',
    'mdi:monitor-dashboard',
    1,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    status = 1;

-- 给超级管理员角色分配 home 权限
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000000'
WHERE NOT EXISTS (
    SELECT 1 FROM admin_role_permissions 
    WHERE role_id = '00000000-0000-0000-0000-000000000001' 
    AND permission_id = '10000000-0000-0000-0000-000000000000'
);
