-- Fix Chinese character encoding for admin menu permissions

-- Update names with correct Chinese characters
UPDATE admin_permissions SET name = '管理员' WHERE code = 'adminManagement';
UPDATE admin_permissions SET name = '管理员用户' WHERE code = 'adminManagement_user';
UPDATE admin_permissions SET name = '角色管理' WHERE code = 'adminManagement_role';
UPDATE admin_permissions SET name = '权限管理' WHERE code = 'adminManagement_permission';
