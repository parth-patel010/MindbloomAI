-- Check users table structure
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
-- Check if plan and credits columns exist
SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
                AND column_name = 'plan'
        ) THEN 'plan column exists'
        ELSE 'plan column missing'
    END as plan_status,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
                AND column_name = 'credits'
        ) THEN 'credits column exists'
        ELSE 'credits column missing'
    END as credits_status;
-- Show sample user data
SELECT id,
    email,
    name,
    plan,
    credits,
    created_at,
    updated_at
FROM users
LIMIT 5;