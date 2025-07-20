-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS roleplay_sessions CASCADE;
DROP TABLE IF EXISTS parent_messages CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS career_interests CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS mood_entries CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with enhanced security
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
    CONSTRAINT password_hash_length CHECK (LENGTH(password_hash) >= 60) -- bcrypt hashes are 60 chars
);

-- Create mood_entries table
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
    mood_text VARCHAR(50) NOT NULL,
    activities JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    advice TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT mood_text_length CHECK (LENGTH(mood_text) <= 50),
    CONSTRAINT notes_length CHECK (LENGTH(notes) <= 2000)
);

-- Create study_sessions table
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0), -- in minutes
    break_duration INTEGER NOT NULL CHECK (break_duration >= 0), -- in minutes
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT subject_length CHECK (LENGTH(subject) >= 1 AND LENGTH(subject) <= 255)
);

-- Create career_interests table
CREATE TABLE career_interests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interests JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    career_suggestions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT career_suggestions_length CHECK (LENGTH(career_suggestions) <= 5000)
);

-- Create quiz_results table
CREATE TABLE quiz_results (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT subject_length CHECK (LENGTH(subject) >= 1 AND LENGTH(subject) <= 255),
    CONSTRAINT score_valid CHECK (score <= total_questions)
);

-- Create parent_messages table
CREATE TABLE parent_messages (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_message TEXT NOT NULL,
    translated_message TEXT NOT NULL,
    emotion_tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT original_message_length CHECK (LENGTH(original_message) >= 1 AND LENGTH(original_message) <= 2000),
    CONSTRAINT translated_message_length CHECK (LENGTH(translated_message) >= 1 AND LENGTH(translated_message) <= 2000)
);

-- Create roleplay_sessions table
CREATE TABLE roleplay_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario VARCHAR(255) NOT NULL,
    conversation_log JSONB DEFAULT '[]'::jsonb,
    confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT scenario_length CHECK (LENGTH(scenario) >= 1 AND LENGTH(scenario) <= 255)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, created_at);

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_created_at ON study_sessions(created_at);

CREATE INDEX idx_career_interests_user_id ON career_interests(user_id);

CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_created_at ON quiz_results(created_at);

CREATE INDEX idx_parent_messages_user_id ON parent_messages(user_id);
CREATE INDEX idx_parent_messages_created_at ON parent_messages(created_at);

CREATE INDEX idx_roleplay_sessions_user_id ON roleplay_sessions(user_id);
CREATE INDEX idx_roleplay_sessions_created_at ON roleplay_sessions(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_interests_updated_at BEFORE UPDATE ON career_interests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a test user for development (remove in production)
-- Password is "TestPassword123!"
INSERT INTO users (id, email, name, password_hash, email_verified, created_at, updated_at)
VALUES (
    'test-user-id-123',
    'test@mindbloom.com',
    'Test User',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
