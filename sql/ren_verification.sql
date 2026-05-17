-- Temporary manual REN/PEA verification support.
-- TypeORM synchronize=true will create the column from the User entity, but this is useful
-- when you want to patch an existing database directly.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ren_status VARCHAR(30) DEFAULT 'not_verified';

UPDATE users
SET ren_status = 'not_verified'
WHERE ren_status IS NULL OR ren_status <> 'verified';

-- Manual admin action for now:
-- UPDATE users SET ren_status = 'verified' WHERE id = '<USER_ID>';
-- UPDATE users SET ren_status = 'not_verified' WHERE id = '<USER_ID>';
