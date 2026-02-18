"""Database initialization and helper functions."""

import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "upwork.db"

def init_db():
    """Initialize database with schema."""
    schema_path = Path(__file__).parent / "schema.sql"
    
    conn = sqlite3.connect(DB_PATH)
    with open(schema_path, 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DB_PATH}")

def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def exec_query(query, params=None, fetch=False):
    """Execute a query and return results if fetch=True."""
    conn = get_db()
    cursor = conn.cursor()
    
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
