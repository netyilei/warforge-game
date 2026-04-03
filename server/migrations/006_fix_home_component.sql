-- Fix home component format
UPDATE admin_permissions SET component = 'layout.base$view.home' WHERE code = 'home';
SELECT code, component FROM admin_permissions WHERE code = 'home';
