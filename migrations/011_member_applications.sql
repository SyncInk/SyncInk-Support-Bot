-- 011_member_applications.sql
-- Storage for Staff and Developer Applications submitted via Web Portal

CREATE TABLE IF NOT EXISTS member_applications (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL,
    global_name VARCHAR(255),
    avatar VARCHAR(255),
    app_type VARCHAR(50) NOT NULL, -- 'staff' | 'developer'
    age INT NOT NULL,
    timezone VARCHAR(100),
    availability VARCHAR(100),
    reason TEXT,
    experience TEXT,
    scenario_1 TEXT,
    scenario_2 TEXT,
    scenario_3 TEXT,
    languages VARCHAR(255),
    portfolio VARCHAR(500),
    bot_experience TEXT,
    complex_features TEXT,
    attachment_name VARCHAR(255),
    attachment_size INT,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'
    reviewer_id BIGINT,
    reviewer_name VARCHAR(255),
    reviewer_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_member_applications_guild
ON member_applications (guild_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_applications_status
ON member_applications (guild_id, status);
