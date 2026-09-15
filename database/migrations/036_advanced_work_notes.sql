ALTER TABLE work_notes
  ADD COLUMN status ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'PUBLISHED' AFTER visibility,
  ADD COLUMN is_knowledge BOOLEAN NOT NULL DEFAULT FALSE AFTER is_important,
  ADD COLUMN knowledge_section VARCHAR(80) NULL AFTER is_knowledge,
  ADD COLUMN company_pinned BOOLEAN NOT NULL DEFAULT FALSE AFTER knowledge_section,
  ADD COLUMN published_at TIMESTAMP NULL AFTER is_archived,
  ADD INDEX idx_work_notes_knowledge(is_knowledge,knowledge_section,status,updated_at),
  ADD INDEX idx_work_notes_status_visibility(status,visibility,updated_at);

ALTER TABLE work_notes MODIFY follow_up_status ENUM('PENDING','COMPLETED','CANCELLED') NULL;

UPDATE work_notes SET status=IF(is_archived,'ARCHIVED','PUBLISHED'),published_at=IF(is_archived,NULL,created_at);

CREATE TABLE note_templates(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,description VARCHAR(255) NULL,
  default_content TEXT NOT NULL,category_id BIGINT UNSIGNED NULL,sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_note_template_name(name),INDEX idx_note_templates_active(is_active,sort_order),
  FOREIGN KEY(category_id) REFERENCES note_categories(id) ON DELETE SET NULL,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO note_templates(name,description,default_content,sort_order) VALUES
('Blank Note','Start with an empty note','',0),
('Bug Fix','Document a defect and its resolution','## Issue\n\n## Root Cause\n\n## Fix Applied\n\n## Files / Areas Changed\n\n## Testing Performed\n\n## Result\n\n## Future Recommendation',10),
('Development Work','Document implementation work','## Goal\n\n## Work Performed\n\n## Technical Decisions\n\n## Testing\n\n## Result\n\n## Next Step',20),
('Deployment','Record a deployment safely','## Environment\n\n## Version / Branch\n\n## Deployment Date\n\n## Changes Deployed\n\n## Database Changes\n\n## Configuration Changes\n\n## Issues During Deployment\n\n## Final Status\n\n## Rollback Information',30),
('Client Update','Capture client decisions and requests','## Client\n\n## Update\n\n## Decisions\n\n## Required Actions\n\n## Next Contact',40),
('Meeting Notes','Record decisions and actions','## Attendees\n\n## Discussion\n\n## Decisions\n\n## Action Items',50),
('Research','Capture reusable research','## Question\n\n## Findings\n\n## Sources\n\n## Recommendation',60),
('Database Change','Document database work','## Purpose\n\n## Schema / Query Changes\n\n## Migration\n\n## Validation\n\n## Rollback',70),
('Server Issue','Document an infrastructure incident','## Symptoms\n\n## Root Cause\n\n## Resolution\n\n## Verification\n\n## Prevention',80),
('Design Update','Record a design decision','## Objective\n\n## Changes\n\n## Rationale\n\n## Review\n\n## Next Step',90),
('General Work Note','Document completed work','## Summary\n\n## Work Performed\n\n## Result\n\n## Next Step',100)
ON DUPLICATE KEY UPDATE description=VALUES(description),default_content=VALUES(default_content),sort_order=VALUES(sort_order);

CREATE TABLE note_comments(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,note_id BIGINT UNSIGNED NOT NULL,author_user_id BIGINT UNSIGNED NOT NULL,
  comment_text VARCHAR(2000) NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,deleted_at TIMESTAMP NULL,
  INDEX idx_note_comments_note(note_id,created_at),FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE,
  FOREIGN KEY(author_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_bookmarks(user_id BIGINT UNSIGNED NOT NULL,note_id BIGINT UNSIGNED NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,note_id),INDEX idx_note_bookmarks_note(note_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_pins(user_id BIGINT UNSIGNED NOT NULL,note_id BIGINT UNSIGNED NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,note_id),INDEX idx_note_pins_note(note_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_relations(note_id BIGINT UNSIGNED NOT NULL,related_note_id BIGINT UNSIGNED NOT NULL,created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(note_id,related_note_id),
  FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE,FOREIGN KEY(related_note_id) REFERENCES work_notes(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_revisions(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,note_id BIGINT UNSIGNED NOT NULL,version_number INT UNSIGNED NOT NULL,
  snapshot JSON NOT NULL,edited_by BIGINT UNSIGNED NOT NULL,edited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_note_revision(note_id,version_number),FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE,
  FOREIGN KEY(edited_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_recent_searches(
  user_id BIGINT UNSIGNED NOT NULL,query VARCHAR(200) NOT NULL,searched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,query),INDEX idx_note_search_recent(user_id,searched_at),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_mentions(
  note_id BIGINT UNSIGNED NOT NULL,mentioned_user_id BIGINT UNSIGNED NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(note_id,mentioned_user_id),FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE,
  FOREIGN KEY(mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions(name,description) VALUES
('notes.comment','Comment on accessible notes'),('notes.manage_comments','Remove any note comment'),
('notes.upload_attachment','Upload note attachments'),('notes.mention_employee','Mention employees in notes'),
('notes.pin_personal','Pin notes personally'),('notes.pin_company','Pin notes company-wide'),
('notes.manage_templates','Manage note templates'),('notes.promote_knowledge','Promote notes to the knowledge base'),
('notes.view_knowledge','View company knowledge'),('notes.manage_knowledge','Manage knowledge visibility and categories'),
('notes.view_revisions','View note revision history'),('notes.restore_revision','Restore note revisions'),
('notes.require_task_documentation','Configure task documentation requirements')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN') AND p.name LIKE 'notes.%';
INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p WHERE UPPER(r.name)='EMPLOYEE' AND p.name IN('notes.comment','notes.mention_employee','notes.pin_personal','notes.view_knowledge','notes.view_revisions','notes.restore_revision');
