# Database

`001_initial_schema.sql` creates `employees`, `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, and `audit_logs` using InnoDB, foreign keys, unique constraints, and lookup indexes.

Migrations are immutable and cumulative. Production environments should record which numbered files were applied. Future features must be introduced in `002_*.sql`, `003_*.sql`, and later files using safe `CREATE TABLE`/`ALTER TABLE` statements; they must never require dropping the foundation tables or recreating the database.

`seed.sql` is idempotent. It creates CEO and Employee roles, the initial permission catalog, and role mappings. Run `npm run seed:admin -w server` afterward to create or reconcile the development CEO account with a runtime-generated bcrypt hash. Both seeds are safe to run repeatedly.
