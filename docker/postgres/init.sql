-- Initialize CodeMate Database
CREATE DATABASE codemate_dev;
CREATE DATABASE codemate_test;

-- Create extension for UUID generation
\c codemate_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c codemate_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Switch back to main database
\c codemate_dev;

-- Create basic tables (will be managed by TypeORM migrations later)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    ***REMOVED***_hash VARCHAR(255),
    avatar_url VARCHAR(255),
    role VARCHAR(20) DEFAULT 'developer',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    visibility VARCHAR(20) DEFAULT 'private',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    path VARCHAR(500) NOT NULL,
    content TEXT,
    language VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO users (email, username, ***REMOVED***_hash, role) VALUES 
('admin@codemate.dev', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('demo@codemate.dev', 'demo', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'developer')
ON CONFLICT (email) DO NOTHING;