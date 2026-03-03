-- Upwork Auto-Apply System Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    budget TEXT,
    category TEXT,
    url TEXT NOT NULL,
    posted_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'new',
    filter_reason TEXT,
    filter_score INTEGER DEFAULT 0,
    client_country TEXT DEFAULT '',
    client_spent TEXT DEFAULT '0',
    client_verified BOOLEAN DEFAULT FALSE,
    proposals_tier TEXT DEFAULT '',
    experience_level TEXT DEFAULT '',
    job_type TEXT DEFAULT '',
    is_saved BOOLEAN DEFAULT FALSE,
    feed_source TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    proposal_text TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    sent_at TIMESTAMP,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS feed_log (
    id SERIAL PRIMARY KEY,
    feed_url TEXT NOT NULL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    new_jobs INTEGER DEFAULT 0,
    duplicates INTEGER DEFAULT 0,
    errors TEXT
);

CREATE TABLE IF NOT EXISTS saved_searches (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    search_keywords TEXT NOT NULL,
    search_filters TEXT NOT NULL,
    budget_filters TEXT NOT NULL,
    client_filters TEXT NOT NULL,
    keyword_blacklist TEXT NOT NULL,
    keyword_whitelist TEXT NOT NULL,
    whitelist_min_score INTEGER DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_job_id ON proposals(job_id);
