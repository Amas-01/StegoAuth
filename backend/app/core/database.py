import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'auth_history.db')


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS auth_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL DEFAULT '',
            image_hash TEXT NOT NULL,
            original_filename TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )
    ''')
    try:
        conn.execute('ALTER TABLE auth_records ADD COLUMN session_id TEXT NOT NULL DEFAULT ""')
    except sqlite3.OperationalError:
        pass
    conn.execute('''
        CREATE INDEX IF NOT EXISTS idx_auth_records_image_hash
        ON auth_records(image_hash)
    ''')
    conn.execute('''
        CREATE INDEX IF NOT EXISTS idx_auth_records_session
        ON auth_records(session_id)
    ''')
    conn.commit()
    conn.close()


def save_auth_record(session_id: str, image_hash: str, original_filename: str = ""):
    conn = get_connection()
    conn.execute(
        'INSERT INTO auth_records (session_id, image_hash, original_filename, created_at) VALUES (?, ?, ?, ?)',
        (session_id, image_hash, original_filename, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()


def find_auth_record(image_hash: str) -> dict | None:
    conn = get_connection()
    cursor = conn.execute(
        'SELECT * FROM auth_records WHERE image_hash = ? ORDER BY created_at DESC LIMIT 1',
        (image_hash,)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_session_records(session_id: str, limit: int = 50) -> list[dict]:
    conn = get_connection()
    cursor = conn.execute(
        'SELECT * FROM auth_records WHERE session_id = ? ORDER BY created_at DESC LIMIT ?',
        (session_id, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]