CREATE TABLE IF NOT EXISTS ticket_panels (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    channel_id BIGINT NOT NULL,
    message_id BIGINT,
    title VARCHAR(255) DEFAULT 'Open a Ticket',
    description TEXT DEFAULT 'Click the button below to open a support ticket.',
    button_color VARCHAR(50) DEFAULT 'blurple',
    button_emoji VARCHAR(100) DEFAULT '🎫',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    channel_id BIGINT NOT NULL,
    creator_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS ticket_support_role_id BIGINT;
ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS ticket_category_id BIGINT;
ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS ticket_transcript_channel_id BIGINT;
