-- 修复 component 字段格式
UPDATE admin_permissions 
SET component = 'layout.base$view.home' 
WHERE code = 'home' AND component = 'view.home';
