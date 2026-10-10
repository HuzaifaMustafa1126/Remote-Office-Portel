-- Phase 7.4: optional credential bundles, account labels, and stable encryption context.

ALTER TABLE twofa_platforms
  ADD COLUMN account_label VARCHAR(100) NULL AFTER platform_custom_name,
  ADD COLUMN encryption_context CHAR(36) NULL AFTER account_label,
  MODIFY COLUMN twofa_information_ciphertext MEDIUMBLOB NULL,
  MODIFY COLUMN twofa_information_iv BINARY(12) NULL,
  MODIFY COLUMN twofa_information_tag BINARY(16) NULL,
  MODIFY COLUMN auth_key_ciphertext BLOB NULL,
  MODIFY COLUMN auth_key_iv BINARY(12) NULL,
  MODIFY COLUMN auth_key_tag BINARY(16) NULL;

UPDATE twofa_platforms
SET encryption_context=UUID()
WHERE encryption_context IS NULL;

ALTER TABLE twofa_platforms
  MODIFY COLUMN encryption_context CHAR(36) NOT NULL,
  ADD CONSTRAINT chk_twofa_information_bundle CHECK (
    (twofa_information_ciphertext IS NULL AND twofa_information_iv IS NULL AND twofa_information_tag IS NULL)
    OR
    (twofa_information_ciphertext IS NOT NULL AND twofa_information_iv IS NOT NULL AND twofa_information_tag IS NOT NULL)
  ),
  ADD CONSTRAINT chk_twofa_auth_key_bundle CHECK (
    (auth_key_ciphertext IS NULL AND auth_key_iv IS NULL AND auth_key_tag IS NULL)
    OR
    (auth_key_ciphertext IS NOT NULL AND auth_key_iv IS NOT NULL AND auth_key_tag IS NOT NULL)
  ),
  ADD CONSTRAINT chk_twofa_has_credential CHECK (
    twofa_information_ciphertext IS NOT NULL OR auth_key_ciphertext IS NOT NULL
  ),
  ADD UNIQUE KEY uq_twofa_platform_encryption_context (encryption_context),
  ADD INDEX idx_twofa_platforms_profile_label (profile_id,account_label);
