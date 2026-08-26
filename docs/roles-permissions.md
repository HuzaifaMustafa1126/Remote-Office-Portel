# Roles and permissions

Authorization is permission-based, never based on a hard-coded role name. A user can hold multiple roles through `user_roles`; roles receive permissions through `role_permissions`.

CEO is seeded with every Phase 1.1 permission. Employee receives `dashboard.view` and `employees.view_own`. Future HR, Manager, Accountant, and Team Lead roles can be created through the roles UI and assigned subsets of the same permission catalog.

The API checks permissions from current database relationships on every protected operation. Client guards only hide unavailable controls and are not a security boundary.
