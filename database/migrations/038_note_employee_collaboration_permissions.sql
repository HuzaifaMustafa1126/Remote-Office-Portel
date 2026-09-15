INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p
WHERE UPPER(r.name)='EMPLOYEE' AND p.name='notes.upload_attachment';
