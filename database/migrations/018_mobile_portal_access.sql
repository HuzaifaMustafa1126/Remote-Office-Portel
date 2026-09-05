-- Grant once to existing privileged roles; do not create or rename roles.
INSERT IGNORE INTO permissions(name, description)
VALUES ('portal.access_mobile', 'Allows this role to access the Remote Office Portal from mobile devices.');
INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name='portal.access_mobile'
WHERE UPPER(r.name) IN ('CEO', 'ADMIN', 'SUPER_ADMIN');
