CREATE TABLE note_categories(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_note_category_name(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO note_categories(name) VALUES
('Development'),('Bug Fix'),('Client Work'),('Design'),('Research'),('Server'),
('Database'),('Deployment'),('Meeting'),('Documentation'),('Testing'),
('Marketing'),('Internal'),('Other')
ON DUPLICATE KEY UPDATE name=VALUES(name);

CREATE TABLE work_notes(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT NULL,
  work_performed TEXT NULL,
  problem TEXT NULL,
  solution TEXT NULL,
  important_information TEXT NULL,
  next_step TEXT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  related_task_id BIGINT UNSIGNED NULL,
  category_id BIGINT UNSIGNED NULL,
  visibility ENUM('PRIVATE','TEAM','MANAGEMENT') NOT NULL DEFAULT 'PRIVATE',
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_date DATE NULL,
  follow_up_status ENUM('PENDING','COMPLETED') NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(author_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(related_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY(category_id) REFERENCES note_categories(id) ON DELETE SET NULL,
  INDEX idx_work_notes_author_archived(author_user_id,is_archived,updated_at),
  INDEX idx_work_notes_visibility_archived(visibility,is_archived,updated_at),
  INDEX idx_work_notes_category(category_id,updated_at),
  INDEX idx_work_notes_task(related_task_id),
  INDEX idx_work_notes_follow_up(follow_up_required,follow_up_status,follow_up_date),
  FULLTEXT KEY ft_work_notes_search(title,content,summary,work_performed,problem,solution,important_information,next_step)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_tags(
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  UNIQUE KEY uq_note_tag_name(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_tag_relations(
  note_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY(note_id,tag_id),
  FOREIGN KEY(note_id) REFERENCES work_notes(id) ON DELETE CASCADE,
  FOREIGN KEY(tag_id) REFERENCES note_tags(id) ON DELETE CASCADE,
  INDEX idx_note_tag_lookup(tag_id,note_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions(name,description) VALUES
('notes.view_own','View own work notes'),
('notes.create','Create work notes'),
('notes.edit_own','Edit own work notes'),
('notes.delete_own','Delete own work notes'),
('notes.view_team','View team-visible work notes'),
('notes.view_all','View all work notes'),
('notes.edit_all','Edit all work notes'),
('notes.delete_all','Permanently delete all work notes'),
('notes.archive','Archive accessible work notes'),
('notes.manage_categories','Manage work note categories')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p
WHERE UPPER(r.name) IN('CEO','ADMIN','SUPER_ADMIN') AND p.name LIKE 'notes.%';
INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p
WHERE UPPER(r.name)='EMPLOYEE' AND p.name IN('notes.view_own','notes.create','notes.edit_own');
