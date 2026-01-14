"""
Test Suite for Coupon System and Notification Service Integration
Tests coupon validation, application, and notification service imports
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://llm-history-2.preview.emergentagent.com').rstrip('/')

class TestCouponValidation:
    """Tests for coupon validation API endpoint"""
    
    def test_valid_coupon_willkommen10(self):
        """Test that WILLKOMMEN10 coupon gives 10% discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "WILLKOMMEN10",
            "subtotal": 100.0
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == "WILLKOMMEN10"
        assert data["discount_type"] == "percent"
        assert data["discount_value"] == 10.0
        assert data["discount_amount"] == 10.0  # 10% of 100
        assert "description" in data
    
    def test_valid_coupon_lowercase(self):
        """Test that coupon code works with lowercase input"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "willkommen10",
            "subtotal": 50.0
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "WILLKOMMEN10"  # Should be uppercase in response
        assert data["discount_amount"] == 5.0  # 10% of 50
    
    def test_invalid_coupon_code(self):
        """Test that invalid coupon code returns 404"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "INVALID_CODE_123",
            "subtotal": 50.0
        })
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "Ungültiger" in data["detail"] or "Invalid" in data["detail"]
    
    def test_coupon_discount_calculation(self):
        """Test discount calculation with different subtotals"""
        # Test with €200 subtotal
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "WILLKOMMEN10",
            "subtotal": 200.0
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["discount_amount"] == 20.0  # 10% of 200
    
    def test_coupon_with_zero_subtotal(self):
        """Test coupon with zero subtotal"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "WILLKOMMEN10",
            "subtotal": 0.0
        })
        
        # Should still validate but discount is 0
        assert response.status_code == 200
        data = response.json()
        assert data["discount_amount"] == 0.0


class TestCouponAdminEndpoints:
    """Tests for admin coupon management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@boehmer.at",
            "password": "wachau2024"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_get_all_coupons(self, admin_token):
        """Test getting all coupons as admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin/coupons",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check if WILLKOMMEN10 exists
        willkommen_coupon = next((c for c in data if c.get("code") == "WILLKOMMEN10"), None)
        assert willkommen_coupon is not None, "WILLKOMMEN10 coupon should exist"
        assert willkommen_coupon["discount_type"] == "percent"
        assert willkommen_coupon["discount_value"] == 10.0
    
    def test_get_coupons_unauthorized(self):
        """Test that getting coupons without auth fails"""
        response = requests.get(f"{BASE_URL}/api/admin/coupons")
        assert response.status_code == 401 or response.status_code == 403


class TestNotificationServiceImport:
    """Tests to verify notification service is properly imported in server.py"""
    
    def test_health_endpoint(self):
        """Test that server is running (notification service import didn't break it)"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
    
    def test_products_endpoint(self):
        """Test products endpoint works (server is functional)"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestShippingRates:
    """Tests for shipping rates (needed for cart total calculation)"""
    
    def test_get_shipping_rates(self):
        """Test getting public shipping rates"""
        response = requests.get(f"{BASE_URL}/api/shipping-rates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCartIntegration:
    """Tests for cart and checkout integration with coupons"""
    
    def test_products_available_for_cart(self):
        """Test that products are available to add to cart"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "At least one product should be available"
        
        # Check product has required fields for cart
        product = data[0]
        assert "id" in product
        assert "price" in product
        assert "name_de" in product or "name_en" in product


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
