-- Add tables for new features
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    situation TEXT NOT NULL,
    distractions JSONB DEFAULT '[]'::jsonb,
    advice TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT situation_length CHECK (LENGTH(situation) >= 1 AND LENGTH(situation) <= 2000)
);

-- Create overwhelm_sessions table
CREATE TABLE IF NOT EXISTS overwhelm_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stressors JSONB DEFAULT '[]'::jsonb,
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    advice TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_created_at ON focus_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_overwhelm_sessions_user_id ON overwhelm_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_overwhelm_sessions_created_at ON overwhelm_sessions(created_at);
