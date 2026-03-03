"""Batch insert jobs from JSON. Used by MCP scraping workflow."""

import json
import sys
from datetime import datetime

sys.path.insert(0, "/Users/growthgod/upwork_scripting_app")
from db.database import exec_query


def insert_jobs(jobs_json: str, keyword: str = ""):
    """Insert jobs from JSON string, skip duplicates."""
    jobs = json.loads(jobs_json)
    new_count = 0
    for job in jobs:
        # Check if exists
        exists = exec_query(
            "SELECT 1 FROM jobs WHERE id = %s", (job["id"],), fetch=True
        )
        if exists:
            continue
        try:
            exec_query(
                """INSERT INTO jobs (id, title, url, description, budget, posted_at, status, fetched_at)
                   VALUES (%s, %s, %s, %s, %s, %s, 'new', %s)""",
                (
                    job["id"],
                    job["title"],
                    job["url"],
                    job["description"][:2000],
                    job["budget"],
                    job["posted_at"] or datetime.now().isoformat(),
                    datetime.now().isoformat(),
                ),
            )
            new_count += 1
        except Exception as e:
            print(f"  Skip {job['id']}: {e}")

    # Log the run
    duplicates = len(jobs) - new_count
    exec_query(
        """INSERT INTO feed_log (feed_url, new_jobs, duplicates, fetched_at)
           VALUES (%s, %s, %s, %s)""",
        (f"search:{keyword}", new_count, duplicates, datetime.now().isoformat()),
    )
    print(f"[{keyword}] {len(jobs)} found, {new_count} new, {duplicates} dupes")
    return new_count


if __name__ == "__main__":
    data = sys.stdin.read()
    keyword = sys.argv[1] if len(sys.argv) > 1 else ""
    insert_jobs(data, keyword)
