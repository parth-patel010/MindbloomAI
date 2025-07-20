-- Update users table with enhanced security fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Update existing users to have default values
UPDATE users 
SET email_verified = FALSE, 
    token_version = 0, 
    failed_login_attempts = 0 
WHERE email_verified IS NULL 
   OR token_version IS NULL 
   OR failed_login_attempts IS NULL;

-- Add constraints for security
ALTER TABLE users 
ADD CONSTRAINT check_failed_attempts CHECK (failed_login_attempts >= 0),
ADD CONSTRAINT check_token_version CHECK (token_version >= 0);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(token_version);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
