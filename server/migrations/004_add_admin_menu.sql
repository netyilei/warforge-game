-- Add Admin Menu and Submenu Permissions

-- Insert Admin Menu Permissions
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
-- Admin Management Menu
('70000000-0000-0000-0000-000000000001', 'Admin', 'admin', 'menu', NULL, '/admin', 'layout.base', 'carbon:user-admin', 7, 1),
('70000000-0000-0000-0000-000000000002', 'Admin Users', 'admin:user', 'menu', '70000000-0000-0000-0000-000000000001', '/admin/user', 'view.admin', 'carbon:user-multiple', 1, 1),
('70000000-0000-0000-0000-000000000003', 'Role Management', 'admin:role', 'menu', '70000000-0000-0000-0000-000000000001', '/admin/role', 'view.role', 'carbon:user-role', 2, 1),
('70000000-0000-0000-0000-000000000004', 'Permission Management', 'admin:permission', 'menu', '70000000-0000-0000-0000-000000000001', '/admin/permission', 'view.permission', 'carbon:locked', 3, 1)
ON CONFLICT (code) DO NOTHING;

-- Assign Admin Menu Permissions to Super Admin Role
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM admin_permissions 
WHERE code IN ('admin', 'admin:user', 'admin:role', 'admin:permission')
ON CONFLICT (role_id, permission_id) DO NOTHING;
