-- PostgreSQL schema reference (run migrations via Sequelize CLI)
-- npm run db:migrate && npm run db:seed

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- See database/migrations for authoritative DDL
