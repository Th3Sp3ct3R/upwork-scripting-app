"""Database initialization and helper functions (PostgreSQL)."""

import psycopg2
import psycopg2.extras
import os
from pathlib import Path

DB_URL = os.getenv("DATABASE_URL", "postgresql://localhost/upwork")

def init_db():
    """Initialize database with schema and run migrations."""
    schema_path = Path(__file__).parent / "schema.sql"

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()

    with open(schema_path, 'r') as f:
        cur.execute(f.read())

    # Add columns to jobs if missing (safe migrations)
    migrations = [
        ("client_country", "TEXT DEFAULT ''"),
        ("client_spent", "TEXT DEFAULT '0'"),
        ("client_verified", "BOOLEAN DEFAULT FALSE"),
        ("proposals_tier", "TEXT DEFAULT ''"),
        ("experience_level", "TEXT DEFAULT ''"),
        ("job_type", "TEXT DEFAULT ''"),
        ("is_saved", "BOOLEAN DEFAULT FALSE"),
        ("feed_source", "TEXT DEFAULT ''"),
    ]
    for col, typedef in migrations:
        try:
            cur.execute(f"ALTER TABLE jobs ADD COLUMN IF NOT EXISTS {col} {typedef}")
        except Exception:
            pass

    conn.close()
    print(f"✅ Database initialized at {DB_URL}")

def get_db():
    """Get database connection."""
    conn = psycopg2.connect(DB_URL)
    return conn

def exec_query(query, params=None, fetch=False):
    """Execute a query and return results if fetch=True."""
    # Convert SQLite-style ? placeholders to PostgreSQL %s
    query = query.replace("?", "%s")

    conn = get_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        if fetch:
            result = cursor.fetchall()
        else:
            conn.commit()
            result = cursor.rowcount
    finally:
        conn.close()

    return result
