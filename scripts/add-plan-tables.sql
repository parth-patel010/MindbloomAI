-- Add plan-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan VARCHAR(10) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 month');

-- Create index for plan queries
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- Create credit usage tracking table
CREATE TABLE IF NOT EXISTS credit_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature VARCHAR(50) NOT NULL,
    credits_used INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT feature_length CHECK (LENGTH(feature) >= 1 AND LENGTH(feature) <= 50),
    CONSTRAINT credits_used_positive CHECK (credits_used > 0)
);

-- Create index for credit usage queries
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON credit_usage(created_at);

-- Update existing users to have default plan values
UPDATE users 
SET plan = 'free', 
    credits = 3,
    credits_reset_at = NOW() + INTERVAL '1 month'
WHERE plan IS NULL OR credits IS NULL;
