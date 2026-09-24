-- Create per-service databases for the microservices architecture
-- This script runs automatically on first PostgreSQL container start

CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE post_db;
CREATE DATABASE feed_db;
CREATE DATABASE notification_db;
CREATE DATABASE message_db;
CREATE DATABASE story_db;

-- Grant the instagram user full access to all databases
GRANT ALL PRIVILEGES ON DATABASE auth_db TO instagram;
GRANT ALL PRIVILEGES ON DATABASE user_db TO instagram;
GRANT ALL PRIVILEGES ON DATABASE post_db TO instagram;
GRANT ALL PRIVILEGES ON DATABASE feed_db TO instagram;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO instagram;
GRANT ALL PRIVILEGES ON DATABASE message_db TO instagram;
GRANT ALL PRIVILEGES ON DATABASE story_db TO instagram;
