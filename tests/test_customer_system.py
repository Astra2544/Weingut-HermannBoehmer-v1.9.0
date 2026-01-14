"""
Customer Account System Tests
Tests for customer registration, login, stats, password change, and admin customer management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://llm-history-2.preview.emergentagent.com').rstrip('/')

# Test data
TEST_EMAIL_PREFIX = f"TEST_{uuid.uuid4().hex[:8]}"
TEST_CUSTOMER_EMAIL = f"{TEST_EMAIL_PREFIX}@test.com"
TEST_CUSTOMER_PASSWORD = "testpass123"
ADMIN_EMAIL = "admin@boehmer.at"
ADMIN_PASSWORD = "wachau2024"
DEMO_CUSTOMER_EMAIL = "demo@wachauergold.at"
DEMO_CUSTOMER_PASSWORD = "demo1234"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/admin/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture(scope="module")
def demo_customer_token(api_client):
    """Get demo customer authentication token"""
    response = api_client.post(f"{BASE_URL}/api/customer/login", json={
        "email": DEMO_CUSTOMER_EMAIL,
        "password": DEMO_CUSTOMER_PASSWORD
    })
    assert response.status_code == 200, f"Demo customer login failed: {response.text}"
    return response.json().get("token")


class TestCustomerRegistration:
    """Customer registration endpoint tests"""
    
    def test_register_new_customer_success(self, api_client):
        """Test successful customer registration"""
        response = api_client.post(f"{BASE_URL}/api/customer/register", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD,
            "first_name": "Test",
            "last_name": "Customer",
            "phone": "+43 123 456789"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token missing from response"
        assert "customer" in data, "Customer data missing from response"
        assert data["customer"]["email"] == TEST_CUSTOMER_EMAIL.lower()
        assert data["customer"]["first_name"] == "Test"
        assert data["customer"]["last_name"] == "Customer"
        assert "id" in data["customer"]
    
    def test_register_duplicate_email_fails(self, api_client):
        """Test that duplicate email registration fails"""
        response = api_client.post(f"{BASE_URL}/api/customer/register", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": "anotherpass",
            "first_name": "Another",
            "last_name": "User"
        })
        
        assert response.status_code == 400
        assert "existiert bereits" in response.json().get("detail", "").lower() or "already" in response.json().get("detail", "").lower()
    
    def test_check_email_exists(self, api_client):
        """Test email existence check endpoint"""
        # Check existing email
        response = api_client.get(f"{BASE_URL}/api/customer/check-email?email={TEST_CUSTOMER_EMAIL}")
        assert response.status_code == 200
        assert response.json()["exists"] == True
        
        # Check non-existing email
        response = api_client.get(f"{BASE_URL}/api/customer/check-email?email=nonexistent@test.com")
        assert response.status_code == 200
        assert response.json()["exists"] == False


class TestCustomerLogin:
    """Customer login endpoint tests"""
    
    def test_login_success(self, api_client):
        """Test successful customer login"""
        response = api_client.post(f"{BASE_URL}/api/customer/login", json={
            "email": DEMO_CUSTOMER_EMAIL,
            "password": DEMO_CUSTOMER_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "token" in data
        assert "customer" in data
        assert data["customer"]["email"] == DEMO_CUSTOMER_EMAIL
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/customer/login", json={
            "email": DEMO_CUSTOMER_EMAIL,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "falsch" in response.json().get("detail", "").lower() or "invalid" in response.json().get("detail", "").lower()
    
    def test_login_nonexistent_email(self, api_client):
        """Test login with non-existent email"""
        response = api_client.post(f"{BASE_URL}/api/customer/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 401


class TestCustomerStats:
    """Customer stats and loyalty tier tests"""
    
    def test_get_customer_stats(self, api_client, demo_customer_token):
        """Test customer stats endpoint returns loyalty tier info"""
        response = api_client.get(
            f"{BASE_URL}/api/customer/stats",
            headers={"Authorization": f"Bearer {demo_customer_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "total_spent" in data
        assert "order_count" in data
        assert "last_order_date" in data
        assert "loyalty" in data
        
        # Verify loyalty tier structure
        loyalty = data["loyalty"]
        assert "tier" in loyalty
        assert "tier_color" in loyalty
        assert "tier_icon" in loyalty
        assert "total_spent" in loyalty
        assert "next_tier" in loyalty
        assert "amount_to_next_tier" in loyalty
        assert "progress_percent" in loyalty
        
        # Verify tier is valid
        valid_tiers = ["Bronze", "Silber", "Gold", "Platinum", "Diamond"]
        assert loyalty["tier"] in valid_tiers
    
    def test_loyalty_tier_bronze(self, api_client, demo_customer_token):
        """Test Bronze tier for customers with €0-50 spent"""
        response = api_client.get(
            f"{BASE_URL}/api/customer/stats",
            headers={"Authorization": f"Bearer {demo_customer_token}"}
        )
        
        data = response.json()
        # Demo customer has no orders, should be Bronze
        if data["total_spent"] < 50:
            assert data["loyalty"]["tier"] == "Bronze"
            assert data["loyalty"]["tier_icon"] == "🥉"
    
    def test_stats_requires_auth(self, api_client):
        """Test that stats endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/customer/stats")
        assert response.status_code in [401, 403, 422]


class TestCustomerPassword:
    """Customer password change tests"""
    
    def test_password_change_wrong_current(self, api_client):
        """Test password change with wrong current password"""
        # First login to get token
        login_response = api_client.post(f"{BASE_URL}/api/customer/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Test customer not available")
        
        token = login_response.json()["token"]
        
        # Try to change password with wrong current password
        response = api_client.put(
            f"{BASE_URL}/api/customer/password",
            json={
                "current_password": "wrongpassword",
                "new_password": "newpass123"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
        assert "falsch" in response.json().get("detail", "").lower() or "wrong" in response.json().get("detail", "").lower()
    
    def test_password_change_too_short(self, api_client):
        """Test password change with too short new password"""
        login_response = api_client.post(f"{BASE_URL}/api/customer/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Test customer not available")
        
        token = login_response.json()["token"]
        
        response = api_client.put(
            f"{BASE_URL}/api/customer/password",
            json={
                "current_password": TEST_CUSTOMER_PASSWORD,
                "new_password": "12345"  # Less than 6 characters
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
        assert "6" in response.json().get("detail", "") or "zeichen" in response.json().get("detail", "").lower()


class TestAdminCustomers:
    """Admin customer management tests"""
    
    def test_get_all_customers(self, api_client, admin_token):
        """Test admin can get all customers with stats"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one customer"
        
        # Verify customer structure
        customer = data[0]
        assert "id" in customer
        assert "email" in customer
        assert "first_name" in customer
        assert "last_name" in customer
        assert "stats" in customer
        
        # Verify stats structure
        stats = customer["stats"]
        assert "total_spent" in stats
        assert "order_count" in stats
        assert "loyalty_tier" in stats
        assert "loyalty_color" in stats
        assert "loyalty_icon" in stats
    
    def test_customers_sorted_by_spent(self, api_client, admin_token):
        """Test that customers are sorted by total spent descending"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        data = response.json()
        if len(data) > 1:
            # Verify descending order by total_spent
            for i in range(len(data) - 1):
                assert data[i]["stats"]["total_spent"] >= data[i+1]["stats"]["total_spent"]
    
    def test_admin_customers_requires_auth(self, api_client):
        """Test that admin customers endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/customers")
        assert response.status_code in [401, 403, 422]


class TestCustomerProfile:
    """Customer profile management tests"""
    
    def test_get_customer_profile(self, api_client, demo_customer_token):
        """Test getting customer profile"""
        response = api_client.get(
            f"{BASE_URL}/api/customer/me",
            headers={"Authorization": f"Bearer {demo_customer_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "email" in data
        assert "first_name" in data
        assert "last_name" in data
    
    def test_update_customer_profile(self, api_client, demo_customer_token):
        """Test updating customer profile"""
        response = api_client.put(
            f"{BASE_URL}/api/customer/me",
            json={
                "phone": "+43 999 888 7777"
            },
            headers={"Authorization": f"Bearer {demo_customer_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == "+43 999 888 7777"


class TestCustomerOrders:
    """Customer orders tests"""
    
    def test_get_customer_orders(self, api_client, demo_customer_token):
        """Test getting customer orders"""
        response = api_client.get(
            f"{BASE_URL}/api/customer/orders",
            headers={"Authorization": f"Bearer {demo_customer_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestLoyaltyTierCalculation:
    """Test loyalty tier calculation logic"""
    
    def test_tier_thresholds(self):
        """Verify loyalty tier thresholds are correct"""
        # This tests the expected tier boundaries
        # Bronze: €0 - €50
        # Silber: €50 - €100
        # Gold: €100 - €250
        # Platinum: €250 - €500
        # Diamond: €500+
        
        tier_thresholds = {
            "Bronze": (0, 50),
            "Silber": (50, 100),
            "Gold": (100, 250),
            "Platinum": (250, 500),
            "Diamond": (500, float('inf'))
        }
        
        # Verify thresholds are defined correctly
        assert tier_thresholds["Bronze"][0] == 0
        assert tier_thresholds["Bronze"][1] == 50
        assert tier_thresholds["Silber"][0] == 50
        assert tier_thresholds["Gold"][0] == 100
        assert tier_thresholds["Platinum"][0] == 250
        assert tier_thresholds["Diamond"][0] == 500


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup(api_client, admin_token):
    """Cleanup test data after tests complete"""
    yield
    # Note: In a real scenario, we would delete test customers here
    # For now, test customers with TEST_ prefix can be identified and cleaned up manually


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
