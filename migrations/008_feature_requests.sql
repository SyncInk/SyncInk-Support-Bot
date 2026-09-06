-- 008_feature_requests.sql
-- Add suggestion_channel_id to guild_settings and create feature_requests table

ALTER TABLE guild_settings 
ADD COLUMN IF NOT EXISTS suggestion_channel_id BIGINT;

CREATE TABLE IF NOT EXISTS feature_requests (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    channel_id BIGINT NOT NULL,
    message_id BIGINT,
    title VARCHAR(255),
    content TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_request_votes (
    request_id INT REFERENCES feature_requests(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    vote_type VARCHAR(10) NOT NULL,
    PRIMARY KEY (request_id, user_id)
);
