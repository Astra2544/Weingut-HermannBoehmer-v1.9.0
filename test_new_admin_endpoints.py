#!/usr/bin/env python3

import sys
import os
sys.path.append('/app')

from backend_test import WachauAPITester

def main():
    """Test the new admin API endpoints with the provided token"""
    
    # The token provided in the review request
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTk4MDJmNWQtYjMwMy00OGU3LWFiZmYtNDY5ZTEzZjUxOTAxIiwiZW1haWwiOiJhZG1pbkBkZW1vLmNvbSIsImV4cCI6MTc2Nzk5MzI0MS4yODYwMzZ9.qEhQEXdoLSJNzD035r7xk5JV8lUP6ZIIu5IJMFWSo50"
    
    # Create tester instance
    tester = WachauAPITester()
    
    # Test the new admin endpoints
    success = tester.test_new_admin_endpoints_with_token(token)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 New Admin Endpoints Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if success and tester.tests_passed == tester.tests_run:
        print("🎉 All new admin endpoint tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())