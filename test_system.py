#!/usr/bin/env python3
"""System test script - Verify all components work."""

import sys
import os
from pathlib import Path

def test_imports():
    """Test that all dependencies can be imported."""
    print("🔍 Testing imports...")
    
    try:
        import playwright
        print("  ✅ playwright")
    except ImportError as e:
        print(f"  ❌ playwright: {e}")
        return False

    try:
        import bs4
        print("  ✅ beautifulsoup4")
    except ImportError as e:
        print(f"  ❌ beautifulsoup4: {e}")
        return False
    
    try:
        from openai import OpenAI
        print("  ✅ openai")
    except ImportError as e:
        print(f"  ❌ openai: {e}")
        return False
    
    try:
        import fastapi
        print("  ✅ fastapi")
    except ImportError as e:
        print(f"  ❌ fastapi: {e}")
        return False
    
    try:
        import dotenv
        print("  ✅ dotenv")
    except ImportError as e:
        print(f"  ❌ dotenv: {e}")
        return False
    
    return True

def test_env():
    """Test that .env is configured."""
    print("\n🔍 Testing environment...")
    
    if not Path(".env").exists():
        print("  ❌ .env file not found")
        print("     → Copy .env.example to .env")
        return False
    
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        print("  ❌ NVIDIA_API_KEY not set in .env")
        return False

    if api_key.startswith("nvapi-"):
        print(f"  ✅ NVIDIA_API_KEY configured")
    else:
        print(f"  ⚠️  NVIDIA_API_KEY may be invalid (should start with 'nvapi-')")
    
    return True

def test_database():
    """Test that database can be initialized."""
    print("\n🔍 Testing database...")

    try:
        from db.database import init_db, exec_query
        init_db()
        print("  ✅ Database initialized")
    except Exception as e:
        print(f"  ❌ Database init failed: {e}")
        return False

    # Check tables exist
    try:
        tables_result = exec_query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            fetch=True
        )
        tables = [row['table_name'] for row in tables_result]

        required = ["jobs", "proposals", "feed_log"]
        for table in required:
            if table in tables:
                print(f"  ✅ Table '{table}' exists")
            else:
                print(f"  ❌ Table '{table}' missing")
                return False
    except Exception as e:
        print(f"  ❌ Database check failed: {e}")
        return False

    return True

def test_api():
    """Test that API can start."""
    print("\n🔍 Testing API startup...")
    
    try:
        from main import app
        print("  ✅ FastAPI app loaded")
    except Exception as e:
        print(f"  ❌ API load failed: {e}")
        return False
    
    # Test health endpoint
    try:
        from fastapi.testclient import TestClient
        client = TestClient(app)
        response = client.get("/health")
        if response.status_code == 200:
            print("  ✅ Health endpoint works")
        else:
            print(f"  ❌ Health endpoint returned {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ API test failed: {e}")
        return False
    
    return True

def test_ai_api():
    """Test AI API connection (NVIDIA / Kimi)."""
    print("\n🔍 Testing AI API...")

    from dotenv import load_dotenv
    load_dotenv()

    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        print("  ⚠️  NVIDIA_API_KEY not set, skipping")
        return True

    try:
        from openai import OpenAI
        import config
        client = OpenAI(api_key=api_key, base_url=config.AI_BASE_URL)

        response = client.chat.completions.create(
            model=config.AI_MODEL,
            max_tokens=50,
            messages=[
                {"role": "user", "content": "Say 'OK' in one word"}
            ]
        )
        print("  ✅ AI API connection works")
        return True
    except Exception as e:
        print(f"  ❌ AI API failed: {e}")
        print("     → Check your API key and account credits")
        return False

def main():
    """Run all tests."""
    print("=" * 60)
    print("🧪 UPWORK AUTO-APPLY SYSTEM TEST")
    print("=" * 60)
    
    results = []
    
    results.append(("Imports", test_imports()))
    results.append(("Environment", test_env()))
    results.append(("Database", test_database()))
    results.append(("API", test_api()))
    results.append(("AI API", test_ai_api()))
    
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{name:<20} {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n✨ All tests passed! Ready to run.")
        print("\nNext steps:")
        print("1. python main.py          # Start the backend")
        print("2. open http://localhost:8000/dashboard/index.html")
        print("3. Click 'Run Cycle' to fetch and generate proposals")
        return 0
    else:
        print("\n❌ Some tests failed. Check errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
