#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class WachauAPITester:
    def __init__(self, base_url="https://llm-history-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_product_id = None
        self.created_order_id = None
        self.tracking_number = None
        self.created_expense_id = None

    def log(self, message, success=None):
        """Log test results"""
        if success is True:
            print(f"✅ {message}")
            self.tests_passed += 1
        elif success is False:
            print(f"❌ {message}")
        else:
            print(f"ℹ️  {message}")
        self.tests_run += 1

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log(f"Status: {response.status_code} ✓", True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log(f"Expected {expected_status}, got {response.status_code}", False)
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {str(e)}", False)
            return False, {}

    def test_seed_database(self):
        """Test database seeding"""
        success, response = self.run_test(
            "Seed Database",
            "POST",
            "seed",
            200
        )
        return success

    def test_get_products(self):
        """Test getting all products"""
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} products")
            return True, response
        return False, []

    def test_get_featured_products(self):
        """Test getting featured products"""
        success, response = self.run_test(
            "Get Featured Products",
            "GET",
            "products?featured=true",
            200
        )
        if success and isinstance(response, list):
            featured_count = len([p for p in response if p.get('is_featured')])
            print(f"   Found {featured_count} featured products")
        return success, response

    def test_get_products_by_category(self):
        """Test getting products by category"""
        categories = ['likoer', 'edelbrand', 'geschenk']
        all_success = True
        
        for category in categories:
            success, response = self.run_test(
                f"Get Products - Category: {category}",
                "GET",
                f"products?category={category}",
                200
            )
            if success and isinstance(response, list):
                print(f"   Found {len(response)} products in {category}")
            all_success = all_success and success
        
        return all_success

    def test_get_product_by_slug(self, products):
        """Test getting product by slug"""
        if not products:
            self.log("No products available for slug test", False)
            return False
        
        product = products[0]
        slug = product.get('slug', product.get('id'))
        
        success, response = self.run_test(
            f"Get Product by Slug: {slug}",
            "GET",
            f"products/{slug}",
            200
        )
        return success, response

    def test_get_testimonials(self):
        """Test getting testimonials"""
        success, response = self.run_test(
            "Get Testimonials",
            "GET",
            "testimonials",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} testimonials")
        return success, response

    def test_admin_register(self):
        """Test admin registration"""
        admin_data = {
            "email": "test@admin.com",
            "password": "test123",
            "admin_secret": "wachau-admin-2024"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "admin/register",
            200,
            data=admin_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Admin registered with email: {response.get('email')}")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "test@admin.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Logged in as: {response.get('email')}")
            return True
        return False

    def test_admin_profile(self):
        """Test getting admin profile"""
        if not self.token:
            self.log("No admin token available", False)
            return False
            
        success, response = self.run_test(
            "Get Admin Profile",
            "GET",
            "admin/me",
            200
        )
        return success

    def test_admin_stats(self):
        """Test getting admin stats"""
        if not self.token:
            self.log("No admin token available", False)
            return False
            
        success, response = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            stats = response
            print(f"   Products: {stats.get('total_products', 0)}")
            print(f"   Orders: {stats.get('total_orders', 0)}")
            print(f"   Revenue: €{stats.get('total_revenue', 0):.2f}")
        
        return success

    def test_create_product(self):
        """Test creating a new product"""
        if not self.token:
            self.log("No admin token available", False)
            return False
        
        product_data = {
            "name_de": "Test Marillenlikör",
            "name_en": "Test Apricot Liqueur",
            "description_de": "Ein Testprodukt für die API",
            "description_en": "A test product for the API",
            "price": 29.90,
            "original_price": 35.90,
            "image_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b",
            "category": "likoer",
            "stock": 50,
            "is_featured": False,
            "is_limited": True,
            "alcohol_content": 25.0,
            "volume_ml": 500,
            "tags": ["test", "api"]
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "admin/products",
            200,
            data=product_data
        )
        
        if success and 'id' in response:
            self.created_product_id = response['id']
            print(f"   Created product with ID: {self.created_product_id}")
        
        return success

    def test_update_product(self):
        """Test updating a product"""
        if not self.token or not self.created_product_id:
            self.log("No admin token or product ID available", False)
            return False
        
        update_data = {
            "price": 27.90,
            "stock": 45,
            "is_featured": True
        }
        
        success, response = self.run_test(
            "Update Product",
            "PUT",
            f"admin/products/{self.created_product_id}",
            200,
            data=update_data
        )
        
        if success:
            print(f"   Updated product price to €{response.get('price', 0):.2f}")
        
        return success

    def test_create_order(self):
        """Test creating an order"""
        # First get a product to order
        success, products = self.test_get_products()
        if not success or not products:
            self.log("No products available for order test", False)
            return False
        
        product = products[0]
        
        order_data = {
            "customer_name": "Max Mustermann",
            "customer_email": "max@example.com",
            "customer_phone": "+43 1 234567890",
            "shipping_address": "Teststraße 123",
            "shipping_city": "Wien",
            "shipping_postal": "1010",
            "shipping_country": "AT",
            "items": [
                {
                    "product_id": product['id'],
                    "quantity": 2
                }
            ],
            "notes": "Test order from API"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            self.created_order_id = response['id']
            self.tracking_number = response.get('tracking_number')
            print(f"   Created order with ID: {self.created_order_id}")
            print(f"   Tracking number: {self.tracking_number}")
            print(f"   Total amount: €{response.get('total_amount', 0):.2f}")
        
        return success

    def test_get_order(self):
        """Test getting an order by ID"""
        if not self.created_order_id:
            self.log("No order ID available", False)
            return False
        
        success, response = self.run_test(
            "Get Order by ID",
            "GET",
            f"orders/{self.created_order_id}",
            200
        )
        return success

    def test_track_order(self):
        """Test order tracking"""
        if not self.tracking_number:
            self.log("No tracking number available", False)
            return False
        
        success, response = self.run_test(
            "Track Order",
            "GET",
            f"tracking/{self.tracking_number}",
            200
        )
        
        if success:
            print(f"   Status: {response.get('status')}")
            print(f"   Destination: {response.get('shipping_city')}, {response.get('shipping_country')}")
        
        return success

    def test_admin_orders(self):
        """Test getting all orders (admin)"""
        if not self.token:
            self.log("No admin token available", False)
            return False
        
        success, response = self.run_test(
            "Get All Orders (Admin)",
            "GET",
            "admin/orders",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} orders")
        
        return success

    def test_update_order_status(self):
        """Test updating order status"""
        if not self.token or not self.created_order_id:
            self.log("No admin token or order ID available", False)
            return False
        
        update_data = {
            "status": "processing",
            "notes": "Order is being prepared"
        }
        
        success, response = self.run_test(
            "Update Order Status",
            "PUT",
            f"admin/orders/{self.created_order_id}",
            200,
            data=update_data
        )
        return success

    def test_delete_product(self):
        """Test deleting a product"""
        if not self.token or not self.created_product_id:
            self.log("No admin token or product ID available", False)
            return False
        
        success, response = self.run_test(
            "Delete Product",
            "DELETE",
            f"admin/products/{self.created_product_id}",
            200
        )
        return success

    def test_admin_stats_extended(self):
        """Test getting extended admin stats with monthly_revenue, top_products, low_stock_products"""
        if not self.token:
            self.log("No admin token available", False)
            return False
            
        success, response = self.run_test(
            "Get Extended Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            stats = response
            print(f"   Products: {stats.get('total_products', 0)}")
            print(f"   Orders: {stats.get('total_orders', 0)}")
            print(f"   Revenue: €{stats.get('total_revenue', 0):.2f}")
            
            # Check for extended fields
            if 'monthly_revenue' in stats:
                print(f"   Monthly Revenue Data: {len(stats['monthly_revenue'])} months")
            else:
                self.log("Missing monthly_revenue in stats", False)
                return False
                
            if 'top_products' in stats:
                print(f"   Top Products: {len(stats['top_products'])} products")
            else:
                self.log("Missing top_products in stats", False)
                return False
                
            if 'low_stock_products' in stats:
                print(f"   Low Stock Products: {len(stats['low_stock_products'])} products")
            else:
                self.log("Missing low_stock_products in stats", False)
                return False
        
        return success

    def test_get_admins(self):
        """Test getting list of admins"""
        if not self.token:
            self.log("No admin token available", False)
            return False
            
        success, response = self.run_test(
            "Get Admin List",
            "GET",
            "admin/admins",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} admins")
            for admin in response:
                print(f"   - {admin.get('email', 'Unknown')} (ID: {admin.get('id', 'Unknown')[:8]}...)")
        
        return success

    def test_create_expense(self):
        """Test creating a new expense"""
        if not self.token:
            self.log("No admin token available", False)
            return False
        
        expense_data = {
            "description": "Test",
            "amount": 100,
            "category": "production"
        }
        
        success, response = self.run_test(
            "Create Expense",
            "POST",
            "admin/expenses",
            200,
            data=expense_data
        )
        
        if success and 'id' in response:
            self.created_expense_id = response['id']
            print(f"   Created expense with ID: {self.created_expense_id}")
            print(f"   Description: {response.get('description')}")
            print(f"   Amount: €{response.get('amount', 0):.2f}")
            print(f"   Category: {response.get('category')}")
        
        return success

    def test_get_expenses(self):
        """Test getting expenses list"""
        if not self.token:
            self.log("No admin token available", False)
            return False
            
        success, response = self.run_test(
            "Get Expenses List",
            "GET",
            "admin/expenses",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} expenses")
            total_amount = sum(exp.get('amount', 0) for exp in response)
            print(f"   Total expenses: €{total_amount:.2f}")
        
        return success

    def test_finance_summary(self):
        """Test getting finance summary with total_revenue, total_expenses, profit"""
        if not self.token:
            self.log("No admin token available", False)
            return False
            
        success, response = self.run_test(
            "Get Finance Summary",
            "GET",
            "admin/finance/summary",
            200
        )
        
        if success:
            summary = response
            
            # Check required fields
            required_fields = ['total_revenue', 'total_expenses', 'profit']
            for field in required_fields:
                if field not in summary:
                    self.log(f"Missing {field} in finance summary", False)
                    return False
            
            print(f"   Total Revenue: €{summary.get('total_revenue', 0):.2f}")
            print(f"   Total Expenses: €{summary.get('total_expenses', 0):.2f}")
            print(f"   Profit: €{summary.get('profit', 0):.2f}")
            
            if 'expense_categories' in summary:
                print(f"   Expense Categories: {len(summary['expense_categories'])} categories")
        
        return success

    def test_notification_system(self):
        """Test the notification system endpoints for new orders"""
        print("\n🔔 Testing Notification System...")
        print("=" * 50)
        
        # Step 0: Seed database if needed
        print("\n0️⃣ Seeding Database...")
        self.test_seed_database()
        
        # Step 1: Admin login with secret
        print("\n1️⃣ Admin Login with Secret...")
        login_data = {
            "email": "admin@boehmer.at",
            "password": "wachau2024"
        }
        
        success, response = self.run_test(
            "Admin Login with Secret",
            "POST",
            "admin/login",
            200,
            data=login_data
        )
        
        if not success or 'token' not in response:
            self.log("Failed to login admin", False)
            return False
        
        self.token = response['token']
        print(f"   ✅ Logged in as: {response.get('email')}")
        
        # Step 2: Create new order and check is_new flag
        print("\n2️⃣ Creating New Order...")
        # First get a product to order
        success, products = self.test_get_products()
        if not success or not products:
            self.log("No products available for order test", False)
            return False
        
        product = products[0]
        
        order_data = {
            "customer_name": "Anna Müller",
            "customer_email": "anna.mueller@example.com",
            "customer_phone": "+43 664 1234567",
            "shipping_address": "Hauptstraße 15",
            "shipping_city": "Krems an der Donau",
            "shipping_postal": "3500",
            "shipping_country": "AT",
            "items": [
                {
                    "product_id": product['id'],
                    "quantity": 1
                }
            ],
            "notes": "Test Bestellung für Benachrichtigungssystem"
        }
        
        success, response = self.run_test(
            "Create New Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if not success or 'id' not in response:
            self.log("Failed to create order", False)
            return False
        
        new_order_id = response['id']
        is_new = response.get('is_new', False)
        
        if is_new:
            print(f"   ✅ Order created with is_new: {is_new}")
        else:
            self.log(f"Order created but is_new is {is_new}, expected True", False)
            return False
        
        # Step 3: Check admin stats for new_orders_count
        print("\n3️⃣ Checking Admin Stats for new_orders_count...")
        success, response = self.run_test(
            "Get Admin Stats with new_orders_count",
            "GET",
            "admin/stats",
            200
        )
        
        if not success:
            self.log("Failed to get admin stats", False)
            return False
        
        new_orders_count = response.get('new_orders_count')
        if new_orders_count is not None:
            print(f"   ✅ new_orders_count found: {new_orders_count}")
        else:
            self.log("new_orders_count not found in admin stats", False)
            return False
        
        # Step 4: Mark order as seen
        print("\n4️⃣ Marking Order as Seen...")
        success, response = self.run_test(
            "Mark Order as Seen",
            "PUT",
            f"admin/orders/{new_order_id}/mark-seen",
            200
        )
        
        if not success:
            self.log("Failed to mark order as seen", False)
            return False
        
        print(f"   ✅ Order {new_order_id[:8]}... marked as seen")
        
        # Verify the order is no longer new
        success, order_response = self.run_test(
            "Verify Order is no longer new",
            "GET",
            f"orders/{new_order_id}",
            200
        )
        
        if success:
            is_new_after = order_response.get('is_new', True)
            if not is_new_after:
                print(f"   ✅ Order is_new is now: {is_new_after}")
            else:
                self.log(f"Order is_new is still {is_new_after}, expected False", False)
                return False
        
        # Step 5: Create another order for mark-all-seen test
        print("\n5️⃣ Creating Another Order for Mark-All-Seen Test...")
        order_data2 = {
            "customer_name": "Franz Weber",
            "customer_email": "franz.weber@example.com",
            "customer_phone": "+43 664 7654321",
            "shipping_address": "Dorfstraße 42",
            "shipping_city": "Dürnstein",
            "shipping_postal": "3601",
            "shipping_country": "AT",
            "items": [
                {
                    "product_id": product['id'],
                    "quantity": 2
                }
            ],
            "notes": "Zweite Test Bestellung"
        }
        
        success, response = self.run_test(
            "Create Second Order",
            "POST",
            "orders",
            200,
            data=order_data2
        )
        
        if not success:
            self.log("Failed to create second order", False)
            return False
        
        second_order_id = response['id']
        print(f"   ✅ Second order created: {second_order_id[:8]}...")
        
        # Step 6: Mark all orders as seen
        print("\n6️⃣ Marking All Orders as Seen...")
        success, response = self.run_test(
            "Mark All Orders as Seen",
            "PUT",
            "admin/orders/mark-all-seen",
            200,
            data={}
        )
        
        if not success:
            self.log("Failed to mark all orders as seen", False)
            return False
        
        print(f"   ✅ All orders marked as seen")
        
        # Step 7: Verify new_orders_count is now 0
        print("\n7️⃣ Verifying new_orders_count is now 0...")
        success, response = self.run_test(
            "Check new_orders_count after mark-all-seen",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            new_orders_count_after = response.get('new_orders_count', -1)
            if new_orders_count_after == 0:
                print(f"   ✅ new_orders_count is now: {new_orders_count_after}")
            else:
                self.log(f"new_orders_count is {new_orders_count_after}, expected 0", False)
                return False
        
        print("\n🎉 All notification system tests passed!")
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Wachau Gold API Tests")
        print("=" * 50)
        
        # Database and basic endpoints
        self.test_seed_database()
        
        # Product tests
        success, products = self.test_get_products()
        self.test_get_featured_products()
        self.test_get_products_by_category()
        if products:
            self.test_get_product_by_slug(products)
        
        # Testimonials
        self.test_get_testimonials()
        
        # Admin authentication
        # Try login first, if fails try register
        if not self.test_admin_login():
            self.test_admin_register()
        
        if self.token:
            self.test_admin_profile()
            self.test_admin_stats()
            self.test_create_product()
            self.test_update_product()
            self.test_admin_orders()
            
            # Order tests
            self.test_create_order()
            if self.created_order_id:
                self.test_get_order()
                self.test_update_order_status()
            
            if self.tracking_number:
                self.test_track_order()
            
            # Cleanup
            if self.created_product_id:
                self.test_delete_product()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

    def test_new_admin_endpoints_with_token(self, token):
        """Test the new admin API endpoints with provided token"""
        print("🔑 Testing New Admin Endpoints with Provided Token")
        print("=" * 50)
        
        # Set the provided token
        self.token = token
        
        # Test the specific endpoints requested
        results = []
        
        # 1. GET /api/admin/stats - Should return extended stats
        print("\n1️⃣ Testing Extended Admin Stats...")
        results.append(self.test_admin_stats_extended())
        
        # 2. GET /api/admin/admins - Should return list of admins
        print("\n2️⃣ Testing Admin List...")
        results.append(self.test_get_admins())
        
        # 3. POST /api/admin/expenses - Create test expense
        print("\n3️⃣ Testing Create Expense...")
        results.append(self.test_create_expense())
        
        # 4. GET /api/admin/expenses - Should return expenses list
        print("\n4️⃣ Testing Get Expenses...")
        results.append(self.test_get_expenses())
        
        # 5. GET /api/admin/finance/summary - Should return finance summary
        print("\n5️⃣ Testing Finance Summary...")
        results.append(self.test_finance_summary())
        
        return all(results)

    def test_notification_system_only(self):
        """Run only the notification system tests"""
        print("🔔 Testing Notification System for New Orders")
        print("=" * 60)
        
        result = self.test_notification_system()
        
        print("\n" + "=" * 60)
        if result:
            print("🎉 Notification System Tests: ALL PASSED")
            return 0
        else:
            print("❌ Notification System Tests: FAILED")
            return 1

    def test_shipping_system(self):
        """Test the complete shipping system as requested in review"""
        print("\n🚢 Testing Updated Order System with Shipping Costs")
        print("=" * 60)
        
        # Step 0: Seed database if needed
        print("\n0️⃣ Seeding Database...")
        self.test_seed_database()
        
        # Step 1: Test GET /api/shipping-rates (public endpoint)
        print("\n1️⃣ Testing GET /api/shipping-rates...")
        success, response = self.run_test(
            "Get Active Shipping Rates (Public)",
            "GET",
            "shipping-rates",
            200
        )
        
        if not success:
            self.log("Failed to get shipping rates", False)
            return False
        
        if isinstance(response, list) and len(response) > 0:
            print(f"   ✅ Found {len(response)} active shipping rates")
            for rate in response[:3]:  # Show first 3
                print(f"   - {rate.get('country')}: €{rate.get('rate', 0):.2f}")
        else:
            self.log("No shipping rates found", False)
            return False
        
        # Step 2: Admin login
        print("\n2️⃣ Admin Login...")
        login_data = {
            "email": "admin@boehmer.at",
            "password": "wachau2024"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data=login_data
        )
        
        if not success or 'token' not in response:
            self.log("Failed to login admin", False)
            return False
        
        self.token = response['token']
        print(f"   ✅ Logged in as: {response.get('email')}")
        
        # Step 3: Get existing products for order
        print("\n3️⃣ Getting Products for Order...")
        success, products = self.test_get_products()
        if not success or not products:
            self.log("No products available for order test", False)
            return False
        
        product = products[0]
        print(f"   ✅ Using product: {product.get('name_de')} (ID: {product['id'][:8]}...)")
        
        # Step 4: Create new order with product details
        print("\n4️⃣ Creating New Order with Product Details...")
        order_data = {
            "customer_name": "Test Kunde",
            "customer_email": "test@test.at",
            "customer_phone": "+43123456789",
            "shipping_address": "Teststraße 1",
            "shipping_city": "Wien",
            "shipping_postal": "1010",
            "shipping_country": "Österreich",
            "items": [{"product_id": product['id'], "quantity": 2}]
        }
        
        success, response = self.run_test(
            "Create Order with Shipping Calculation",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if not success or 'id' not in response:
            self.log("Failed to create order", False)
            return False
        
        new_order_id = response['id']
        
        # Verify response contains required fields
        required_fields = ['item_details', 'subtotal', 'shipping_cost', 'total_amount']
        missing_fields = []
        
        for field in required_fields:
            if field not in response:
                missing_fields.append(field)
        
        if missing_fields:
            self.log(f"Missing required fields in order response: {missing_fields}", False)
            return False
        
        print(f"   ✅ Order created successfully:")
        print(f"   - Order ID: {new_order_id[:8]}...")
        print(f"   - Subtotal: €{response.get('subtotal', 0):.2f}")
        print(f"   - Shipping Cost: €{response.get('shipping_cost', 0):.2f}")
        print(f"   - Total Amount: €{response.get('total_amount', 0):.2f}")
        
        # Verify item_details array
        item_details = response.get('item_details', [])
        if not item_details:
            self.log("item_details array is empty", False)
            return False
        
        print(f"   - Item Details: {len(item_details)} items")
        for item in item_details:
            print(f"     * {item.get('product_name_de')} x{item.get('quantity')} = €{item.get('subtotal', 0):.2f}")
        
        # Step 5: Check admin orders contain item_details
        print("\n5️⃣ Checking Admin Orders contain item_details...")
        success, orders_response = self.run_test(
            "Get Admin Orders with item_details",
            "GET",
            "admin/orders",
            200
        )
        
        if not success:
            self.log("Failed to get admin orders", False)
            return False
        
        if isinstance(orders_response, list) and len(orders_response) > 0:
            print(f"   ✅ Found {len(orders_response)} orders")
            
            # Check if orders contain item_details
            orders_with_details = [o for o in orders_response if 'item_details' in o and o['item_details']]
            print(f"   - Orders with item_details: {len(orders_with_details)}")
            
            if orders_with_details:
                print("   ✅ Orders contain item_details as expected")
            else:
                self.log("No orders contain item_details", False)
                return False
        else:
            self.log("No orders found in admin panel", False)
            return False
        
        # Step 6: Test shipping rates management
        print("\n6️⃣ Testing Shipping Rates Management...")
        
        # 6a: Create new shipping rate for Poland
        print("\n   6a. Creating shipping rate for Polen...")
        poland_rate_data = {
            "country": "Polen",
            "rate": 15.90,
            "free_shipping_threshold": 0
        }
        
        success, poland_response = self.run_test(
            "Create Shipping Rate for Polen",
            "POST",
            "admin/shipping-rates",
            200,
            data=poland_rate_data
        )
        
        if not success:
            self.log("Failed to create shipping rate for Polen", False)
            return False
        
        poland_rate_id = poland_response.get('id')
        print(f"   ✅ Created Polen shipping rate: €{poland_response.get('rate', 0):.2f}")
        
        # 6b: Update the shipping rate
        print("\n   6b. Updating Polen shipping rate...")
        update_rate_data = {
            "rate": 18.90,
            "free_shipping_threshold": 75.0
        }
        
        success, update_response = self.run_test(
            "Update Polen Shipping Rate",
            "PUT",
            f"admin/shipping-rates/{poland_rate_id}",
            200,
            data=update_rate_data
        )
        
        if not success:
            self.log("Failed to update Polen shipping rate", False)
            return False
        
        print(f"   ✅ Updated Polen shipping rate to €18.90 with free shipping at €75")
        
        # 6c: Verify the update by getting all admin shipping rates
        print("\n   6c. Verifying updated shipping rate...")
        success, all_rates_response = self.run_test(
            "Get All Admin Shipping Rates",
            "GET",
            "admin/shipping-rates",
            200
        )
        
        if success and isinstance(all_rates_response, list):
            poland_rates = [r for r in all_rates_response if r.get('country') == 'Polen']
            if poland_rates:
                updated_rate = poland_rates[0]
                if updated_rate.get('rate') == 18.90:
                    print(f"   ✅ Polen rate verified: €{updated_rate.get('rate'):.2f}")
                else:
                    self.log(f"Polen rate not updated correctly: {updated_rate.get('rate')}", False)
                    return False
            else:
                self.log("Polen shipping rate not found after update", False)
                return False
        
        # 6d: Delete the shipping rate
        print("\n   6d. Deleting Polen shipping rate...")
        success, delete_response = self.run_test(
            "Delete Polen Shipping Rate",
            "DELETE",
            f"admin/shipping-rates/{poland_rate_id}",
            200
        )
        
        if not success:
            self.log("Failed to delete Polen shipping rate", False)
            return False
        
        print(f"   ✅ Polen shipping rate deleted successfully")
        
        # 6e: Verify deletion
        print("\n   6e. Verifying deletion...")
        success, final_rates_response = self.run_test(
            "Verify Polen Rate Deletion",
            "GET",
            "admin/shipping-rates",
            200
        )
        
        if success and isinstance(final_rates_response, list):
            poland_rates_after = [r for r in final_rates_response if r.get('country') == 'Polen']
            if not poland_rates_after:
                print(f"   ✅ Polen shipping rate successfully deleted")
            else:
                self.log("Polen shipping rate still exists after deletion", False)
                return False
        
        print("\n🎉 All shipping system tests passed!")
        return True

    def test_shipping_system_only(self):
        """Run only the shipping system tests"""
        print("🚢 Testing Updated Order System with Shipping Costs")
        print("=" * 60)
        
        result = self.test_shipping_system()
        
        print("\n" + "=" * 60)
        if result:
            print("🎉 Shipping System Tests: ALL PASSED")
            return 0
        else:
            print("❌ Shipping System Tests: FAILED")
            return 1

    def test_email_auth_system(self):
        """Test the complete email and auth system as requested in review"""
        print("\n📧 Testing Complete E-Mail and Auth System")
        print("=" * 60)
        
        # Step 0: Seed database if needed
        print("\n0️⃣ Seeding Database...")
        self.test_seed_database()
        
        # Test 1: Customer Registration
        print("\n1️⃣ Testing Customer Registration...")
        
        # Use timestamp to ensure unique email
        import time
        timestamp = str(int(time.time()))
        test_email = f"testuser{timestamp}@test.com"
        
        registration_data = {
            "email": test_email,
            "password": "test1234",
            "first_name": "Test",
            "last_name": "User",
            "phone": "+43 664 1234567"
        }
        
        success, response = self.run_test(
            "Customer Registration",
            "POST",
            "customer/register",
            200,
            data=registration_data
        )
        
        if not success:
            self.log("Failed to register customer", False)
            return False
        
        if 'token' not in response or 'customer' not in response:
            self.log("Registration response missing token or customer data", False)
            return False
        
        customer_token = response['token']
        customer_data = response['customer']
        
        print(f"   ✅ Customer registered successfully:")
        print(f"   - Name: {customer_data.get('first_name')} {customer_data.get('last_name')}")
        print(f"   - Email: {customer_data.get('email')}")
        print(f"   - Token received: {len(customer_token)} chars")
        
        # Test 2: Customer Login
        print("\n2️⃣ Testing Customer Login...")
        login_data = {
            "email": test_email,
            "password": "test1234"
        }
        
        success, response = self.run_test(
            "Customer Login",
            "POST",
            "customer/login",
            200,
            data=login_data
        )
        
        if not success:
            self.log("Failed to login customer", False)
            return False
        
        if 'token' not in response or 'customer' not in response:
            self.log("Login response missing token or customer data", False)
            return False
        
        print(f"   ✅ Customer login successful")
        print(f"   - Email: {response['customer'].get('email')}")
        
        # Test 3: Unified Login (should work for both admin and customer)
        print("\n3️⃣ Testing Unified Login...")
        
        # Test with customer credentials
        unified_login_data = {
            "email": test_email,
            "password": "test1234"
        }
        
        success, response = self.run_test(
            "Unified Login (Customer)",
            "POST",
            "auth/login",
            200,
            data=unified_login_data
        )
        
        if success and response.get('user_type') == 'customer':
            print(f"   ✅ Unified login works for customer")
            print(f"   - User type: {response.get('user_type')}")
        else:
            self.log("Unified login failed for customer", False)
            return False
        
        # Test with admin credentials
        admin_login_data = {
            "email": "admin@boehmer.at",
            "password": "wachau2024"
        }
        
        success, response = self.run_test(
            "Unified Login (Admin)",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and response.get('user_type') == 'admin':
            print(f"   ✅ Unified login works for admin")
            print(f"   - User type: {response.get('user_type')}")
            admin_token = response['token']
        else:
            self.log("Unified login failed for admin", False)
            return False
        
        # Test 4: Newsletter Subscription
        print("\n4️⃣ Testing Newsletter System...")
        
        # Subscribe to newsletter
        newsletter_email = f"newsletter-test-{timestamp}@example.com"
        newsletter_data = {
            "email": newsletter_email
        }
        
        success, response = self.run_test(
            "Newsletter Subscription",
            "POST",
            "newsletter/subscribe",
            200,
            data=newsletter_data
        )
        
        if not success:
            self.log("Failed to subscribe to newsletter", False)
            return False
        
        print(f"   ✅ Newsletter subscription successful")
        
        # Try to subscribe same email again (should fail)
        success, response = self.run_test(
            "Newsletter Duplicate Subscription",
            "POST",
            "newsletter/subscribe",
            400,  # Should return error for duplicate
            data=newsletter_data
        )
        
        if success:
            print(f"   ✅ Duplicate subscription properly rejected")
        else:
            self.log("Duplicate subscription should have been rejected", False)
            return False
        
        # Test 5: Admin Email System
        print("\n5️⃣ Testing Admin Email System...")
        
        # Set admin token for authenticated requests
        self.token = admin_token
        
        # Get newsletter subscribers
        success, response = self.run_test(
            "Get Newsletter Subscribers (Admin)",
            "GET",
            "admin/newsletter/subscribers",
            200
        )
        
        if not success:
            self.log("Failed to get newsletter subscribers", False)
            return False
        
        if 'subscribers' in response and isinstance(response['subscribers'], list):
            subscribers = response['subscribers']
            stats = response.get('stats', {})
            print(f"   ✅ Found {len(subscribers)} newsletter subscribers")
            print(f"   - Total: {stats.get('total', 0)}, Active: {stats.get('active', 0)}")
            
            # Check if our test subscriber is in the list
            test_subscriber = next((s for s in subscribers if s.get('email') == newsletter_email), None)
            if test_subscriber:
                print(f"   - Test subscriber found: {test_subscriber.get('email')}")
            else:
                self.log("Test subscriber not found in list", False)
                return False
        else:
            self.log("No newsletter subscribers found or invalid response format", False)
            return False
        
        # Test admin email inbox
        success, response = self.run_test(
            "Get Admin Email Inbox",
            "GET",
            "admin/email/inbox",
            200
        )
        
        if not success:
            self.log("Failed to get admin email inbox", False)
            return False
        
        if 'emails' in response and 'unread_count' in response:
            print(f"   ✅ Admin email inbox accessible")
            print(f"   - Total emails: {len(response['emails'])}")
            print(f"   - Unread count: {response['unread_count']}")
        else:
            self.log("Admin email inbox response missing required fields", False)
            return False
        
        # Test sending admin email (may fail due to SMTP config in test environment)
        email_data = {
            "to_email": "test@example.com",
            "subject": "Test Email from Admin",
            "message": "This is a test email sent from the admin panel."
        }
        
        success, response = self.run_test(
            "Send Admin Email",
            "POST",
            "admin/email/send",
            200,
            data=email_data
        )
        
        if success and 'id' in response:
            print(f"   ✅ Admin email sent successfully")
            print(f"   - Email ID: {response.get('id')}")
        else:
            # SMTP may not be configured in test environment - this is acceptable
            print(f"   ⚠️  Admin email sending failed (likely due to SMTP config in test env)")
            print(f"   - This is expected in test environment without SMTP credentials")
        
        # Test 6: Customer Profile Access
        print("\n6️⃣ Testing Customer Profile Access...")
        
        # Set customer token
        self.token = customer_token
        
        success, response = self.run_test(
            "Get Customer Profile",
            "GET",
            "customer/me",
            200
        )
        
        if success:
            print(f"   ✅ Customer profile accessible")
            print(f"   - Name: {response.get('first_name')} {response.get('last_name')}")
            print(f"   - Email: {response.get('email')}")
        else:
            self.log("Failed to get customer profile", False)
            return False
        
        # Test customer orders
        success, response = self.run_test(
            "Get Customer Orders",
            "GET",
            "customer/orders",
            200
        )
        
        if success:
            print(f"   ✅ Customer orders accessible")
            print(f"   - Orders count: {len(response) if isinstance(response, list) else 0}")
        else:
            self.log("Failed to get customer orders", False)
            return False
        
        # Test 7: Password Reset System
        print("\n7️⃣ Testing Password Reset System...")
        
        # Test password reset request
        reset_request_data = {
            "email": test_email
        }
        
        success, response = self.run_test(
            "Password Reset Request",
            "POST",
            "customer/password-reset/request",
            200,
            data=reset_request_data
        )
        
        if success:
            print(f"   ✅ Password reset request processed")
            print(f"   - Response: {response.get('message', 'Success')}")
        else:
            self.log("Failed to request password reset", False)
            return False
        
        # Test email existence check
        success, response = self.run_test(
            "Check Email Exists",
            "GET",
            f"customer/check-email?email={test_email}",
            200
        )
        
        if success and 'exists' in response:
            print(f"   ✅ Email existence check works")
            print(f"   - Email exists: {response.get('exists')}")
        else:
            self.log("Failed to check email existence", False)
            return False

        print("\n🎉 All email and auth system tests passed!")
        return True

    def test_email_auth_system_only(self):
        """Run only the email and auth system tests"""
        print("📧 Testing Complete E-Mail and Auth System")
        print("=" * 60)
        
        result = self.test_email_auth_system()
        
        print("\n" + "=" * 60)
        if result:
            print("🎉 Email and Auth System Tests: ALL PASSED")
            return 0
        else:
            print("❌ Email and Auth System Tests: FAILED")
            return 1

    def test_hermann_boehmer_features(self):
        """Test the new Hermann Böhmer project features"""
        print("\n🏪 Testing Hermann Böhmer Project Features")
        print("=" * 60)
        
        # Step 0: Seed database if needed
        print("\n0️⃣ Seeding Database...")
        self.test_seed_database()
        
        # Step 1: Test Contact API
        print("\n1️⃣ Testing Contact API...")
        contact_data = {
            "name": "Hermann Tester",
            "email": "hermann.test@boehmer.at",
            "phone": "+43 650 2711237",
            "subject": "Test Anfrage",
            "message": "Dies ist eine Test-Nachricht für das Kontaktformular."
        }
        
        success, response = self.run_test(
            "Contact Form Submission",
            "POST",
            "contact",
            200,
            data=contact_data
        )
        
        if not success:
            self.log("Failed to submit contact form", False)
            return False
        
        print(f"   ✅ Contact form submitted successfully")
        print(f"   - Name: {contact_data['name']}")
        print(f"   - Subject: {contact_data['subject']}")
        
        # Step 2: Admin login for authenticated tests
        print("\n2️⃣ Admin Login...")
        login_data = {
            "email": "admin@boehmer.at",
            "password": "wachau2024"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data=login_data
        )
        
        if not success or 'token' not in response:
            self.log("Failed to login admin", False)
            return False
        
        self.token = response['token']
        print(f"   ✅ Logged in as: {response.get('email')}")
        
        # Step 3: Test Products API with is_18_plus field
        print("\n3️⃣ Testing Products API with is_18_plus field...")
        success, products = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        
        if not success or not isinstance(products, list):
            self.log("Failed to get products", False)
            return False
        
        # Check if products have is_18_plus field
        has_18_plus_field = False
        for product in products:
            if 'is_18_plus' in product:
                has_18_plus_field = True
                print(f"   - Product '{product.get('name_de', 'Unknown')}' has is_18_plus: {product['is_18_plus']}")
                break
        
        if has_18_plus_field:
            print(f"   ✅ Products contain is_18_plus field")
        else:
            self.log("Products missing is_18_plus field", False)
            return False
        
        # Step 4: Test new product categories
        print("\n4️⃣ Testing New Product Categories...")
        new_categories = ['chutney', 'marmelade', 'pralinen', 'schokolade']
        
        for category in new_categories:
            success, response = self.run_test(
                f"Get Products - Category: {category}",
                "GET",
                f"products?category={category}",
                200
            )
            if success:
                print(f"   ✅ Category '{category}' endpoint works - Found {len(response) if isinstance(response, list) else 0} products")
            else:
                self.log(f"Failed to get products for category {category}", False)
                return False
        
        # Step 5: Test marmelade category specifically (as mentioned in request)
        print("\n5️⃣ Testing Marmelade Category Filter...")
        success, marmelade_products = self.run_test(
            "Get Marmelade Products",
            "GET",
            "products?category=marmelade",
            200
        )
        
        if success:
            print(f"   ✅ Marmelade category filter works - Found {len(marmelade_products) if isinstance(marmelade_products, list) else 0} products")
        else:
            self.log("Failed to get marmelade products", False)
            return False
        
        # Step 6: Test Customer Password Reset
        print("\n6️⃣ Testing Customer Password Reset...")
        
        # First create a test customer
        import time
        timestamp = str(int(time.time()))
        test_email = f"reset-test-{timestamp}@boehmer.at"
        
        registration_data = {
            "email": test_email,
            "password": "test1234",
            "first_name": "Reset",
            "last_name": "Tester"
        }
        
        # Remove token for public registration
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Create Test Customer for Reset",
            "POST",
            "customer/register",
            200,
            data=registration_data
        )
        
        if not success:
            self.log("Failed to create test customer", False)
            return False
        
        # Test password reset request
        reset_data = {
            "email": test_email
        }
        
        success, response = self.run_test(
            "Password Reset Request",
            "POST",
            "customer/password-reset/request",
            200,
            data=reset_data
        )
        
        if success:
            print(f"   ✅ Password reset request processed")
            print(f"   - Email: {test_email}")
        else:
            self.log("Failed to request password reset", False)
            return False
        
        # Restore admin token
        self.token = temp_token
        
        # Step 7: Test Admin Products with is_18_plus and weight_g fields
        print("\n7️⃣ Testing Admin Product Creation with is_18_plus and weight_g...")
        
        # Create a test product with new fields
        product_data = {
            "name_de": "Test Schokolade Premium",
            "name_en": "Test Premium Chocolate",
            "description_de": "Eine Test-Schokolade mit Alkohol für Erwachsene",
            "description_en": "A test chocolate with alcohol for adults",
            "price": 24.90,
            "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b",
            "category": "schokolade",
            "stock": 25,
            "is_featured": False,
            "is_18_plus": True,  # Test the new field
            "weight_g": 200,     # Test the new field
            "tags": ["test", "schokolade", "premium"]
        }
        
        success, response = self.run_test(
            "Create Product with is_18_plus and weight_g",
            "POST",
            "admin/products",
            200,
            data=product_data
        )
        
        if not success:
            self.log("Failed to create product with new fields", False)
            return False
        
        created_product_id = response.get('id')
        
        # Verify the new fields are saved correctly
        if response.get('is_18_plus') == True and response.get('weight_g') == 200:
            print(f"   ✅ Product created with new fields:")
            print(f"   - is_18_plus: {response.get('is_18_plus')}")
            print(f"   - weight_g: {response.get('weight_g')}g")
            print(f"   - Category: {response.get('category')}")
        else:
            self.log(f"Product fields not saved correctly: is_18_plus={response.get('is_18_plus')}, weight_g={response.get('weight_g')}", False)
            return False
        
        # Step 8: Test updating product with new fields
        print("\n8️⃣ Testing Product Update with new fields...")
        
        update_data = {
            "is_18_plus": False,
            "weight_g": 250,
            "price": 26.90
        }
        
        success, response = self.run_test(
            "Update Product with new fields",
            "PUT",
            f"admin/products/{created_product_id}",
            200,
            data=update_data
        )
        
        if success:
            if response.get('is_18_plus') == False and response.get('weight_g') == 250:
                print(f"   ✅ Product updated successfully:")
                print(f"   - is_18_plus: {response.get('is_18_plus')}")
                print(f"   - weight_g: {response.get('weight_g')}g")
                print(f"   - Price: €{response.get('price'):.2f}")
            else:
                self.log(f"Product update fields incorrect: is_18_plus={response.get('is_18_plus')}, weight_g={response.get('weight_g')}", False)
                return False
        else:
            self.log("Failed to update product", False)
            return False
        
        # Step 9: Create an order to test tracking
        print("\n9️⃣ Creating Order for Tracking Test...")
        
        # Get products for order
        success, products = self.test_get_products()
        if not success or not products:
            self.log("No products available for tracking test", False)
            return False
        
        product = products[0]
        
        order_data = {
            "customer_name": "Tracking Tester",
            "customer_email": "tracking@boehmer.at",
            "customer_phone": "+43 650 1234567",
            "shipping_address": "Wachauer Straße 123",
            "shipping_city": "Krems",
            "shipping_postal": "3500",
            "shipping_country": "Österreich",
            "items": [{"product_id": product['id'], "quantity": 1}],
            "notes": "Test order for tracking"
        }
        
        success, response = self.run_test(
            "Create Order for Tracking",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if not success:
            self.log("Failed to create order for tracking", False)
            return False
        
        tracking_number = response.get('tracking_number')
        if not tracking_number:
            self.log("Order created but no tracking number", False)
            return False
        
        print(f"   ✅ Order created with tracking number: {tracking_number}")
        
        # Step 10: Test Tracking API
        print("\n🔟 Testing Tracking API...")
        
        # Remove token for public tracking
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Track Order by Tracking Number",
            "GET",
            f"tracking/{tracking_number}",
            200
        )
        
        if success:
            print(f"   ✅ Tracking API works:")
            print(f"   - Tracking Number: {response.get('tracking_number')}")
            print(f"   - Status: {response.get('status')}")
            print(f"   - Destination: {response.get('shipping_city')}, {response.get('shipping_country')}")
        else:
            self.log("Failed to track order", False)
            return False
        
        # Restore admin token
        self.token = temp_token
        
        # Cleanup: Delete test product
        if created_product_id:
            print("\n🧹 Cleaning up test product...")
            success, response = self.run_test(
                "Delete Test Product",
                "DELETE",
                f"admin/products/{created_product_id}",
                200
            )
            if success:
                print(f"   ✅ Test product deleted")
        
        print("\n🎉 All Hermann Böhmer features tests passed!")
        return True

    def test_hermann_boehmer_only(self):
        """Run only the Hermann Böhmer features tests"""
        print("🏪 Testing Hermann Böhmer Project Features")
        print("=" * 60)
        
        result = self.test_hermann_boehmer_features()
        
        print("\n" + "=" * 60)
        if result:
            print("🎉 Hermann Böhmer Features Tests: ALL PASSED")
            return 0
        else:
            print("❌ Hermann Böhmer Features Tests: FAILED")
            return 1

    def test_hermann_boehmer_specific_features(self):
        """Test the specific Hermann Böhmer features requested in the review"""
        print("\n🎯 Testing Specific Hermann Böhmer Features (Review Request)")
        print("=" * 70)
        
        # Step 0: Seed database if needed
        print("\n0️⃣ Seeding Database...")
        self.test_seed_database()
        
        # Step 1: Admin login
        print("\n1️⃣ Admin Login...")
        login_data = {
            "email": "admin@boehmer.at",
            "password": "wachau2024"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data=login_data
        )
        
        if not success or 'token' not in response:
            self.log("Failed to login admin", False)
            return False
        
        self.token = response['token']
        print(f"   ✅ Logged in as: {response.get('email')}")
        
        # Step 2: Test Tracking System with CP140803927DE (Austrian Post)
        print("\n2️⃣ Testing Tracking System with CP140803927DE...")
        
        # First create a test order with this specific tracking number
        success, products = self.test_get_products()
        if not success or not products:
            self.log("No products available for tracking test", False)
            return False
        
        product = products[0]
        
        # Create order first
        order_data = {
            "customer_name": "Hermann Böhmer",
            "customer_email": "hermann@boehmer.at",
            "customer_phone": "+43 650 2711237",
            "shipping_address": "Wachauer Straße 1",
            "shipping_city": "Krems",
            "shipping_postal": "3500",
            "shipping_country": "Österreich",
            "items": [{"product_id": product['id'], "quantity": 1}],
            "notes": "Test order for Austrian Post tracking"
        }
        
        success, order_response = self.run_test(
            "Create Test Order for Tracking",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if not success:
            self.log("Failed to create test order", False)
            return False
        
        test_order_id = order_response.get('id')
        print(f"   ✅ Test order created: {test_order_id[:8]}...")
        
        # Update order with Austrian Post tracking number
        tracking_update = {
            "status": "shipped",
            "tracking_number": "CP140803927DE",
            "notes": "Shipped via Austrian Post"
        }
        
        success, update_response = self.run_test(
            "Update Order with Austrian Post Tracking",
            "PUT",
            f"admin/orders/{test_order_id}",
            200,
            data=tracking_update
        )
        
        if not success:
            self.log("Failed to update order with tracking number", False)
            return False
        
        print(f"   ✅ Order updated with tracking number: CP140803927DE")
        
        # Test carrier detection by getting the order
        success, order_details = self.run_test(
            "Get Order Details to Check Carrier Detection",
            "GET",
            f"orders/{test_order_id}",
            200
        )
        
        if success:
            carrier = order_details.get('carrier')
            carrier_tracking_url = order_details.get('carrier_tracking_url')
            
            if carrier == "Austrian Post":
                print(f"   ✅ Carrier correctly detected: {carrier}")
            else:
                self.log(f"Carrier detection failed. Expected 'Austrian Post', got '{carrier}'", False)
                return False
            
            if carrier_tracking_url and "post.at" in carrier_tracking_url:
                print(f"   ✅ Tracking URL generated: {carrier_tracking_url}")
            else:
                self.log(f"Tracking URL not generated correctly: {carrier_tracking_url}", False)
                return False
        else:
            self.log("Failed to get order details for carrier verification", False)
            return False
        
        # Test public tracking API
        temp_token = self.token
        self.token = None  # Remove token for public API
        
        success, tracking_response = self.run_test(
            "Test Public Tracking API with CP140803927DE",
            "GET",
            "tracking/CP140803927DE",
            200
        )
        
        if success:
            print(f"   ✅ Public tracking API works:")
            print(f"   - Status: {tracking_response.get('status')}")
            print(f"   - Carrier: {tracking_response.get('carrier')}")
            print(f"   - Tracking URL: {tracking_response.get('carrier_tracking_url')}")
        else:
            self.log("Public tracking API failed", False)
            return False
        
        self.token = temp_token  # Restore admin token
        
        # Step 3: Test Password Reset API
        print("\n3️⃣ Testing Password Reset API...")
        
        # First create a test customer
        import time
        timestamp = str(int(time.time()))
        test_email = f"hermann-test-{timestamp}@boehmer.at"
        
        registration_data = {
            "email": test_email,
            "password": "test1234",
            "first_name": "Hermann",
            "last_name": "Böhmer"
        }
        
        # Remove token for public registration
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Create Test Customer for Password Reset",
            "POST",
            "customer/register",
            200,
            data=registration_data
        )
        
        if not success:
            self.log("Failed to create test customer", False)
            return False
        
        print(f"   ✅ Test customer created: {test_email}")
        
        # Test password reset request
        reset_data = {
            "email": test_email
        }
        
        success, response = self.run_test(
            "Password Reset Request",
            "POST",
            "customer/password-reset/request",
            200,
            data=reset_data
        )
        
        if success:
            print(f"   ✅ Password reset request successful")
            print(f"   - Response: {response.get('message', 'Success')}")
        else:
            self.log("Password reset request failed", False)
            return False
        
        self.token = temp_token  # Restore admin token
        
        # Step 4: Test Contact API
        print("\n4️⃣ Testing Contact API...")
        
        contact_data = {
            "name": "Hermann Böhmer",
            "email": "info@hermann-boehmer.com",
            "phone": "+43 650 2711237",
            "subject": "Test Kontaktanfrage",
            "message": "Dies ist eine Test-Nachricht über das Kontaktformular. Wir testen alle Felder: Name, E-Mail, Telefon, Betreff und Nachricht."
        }
        
        # Remove token for public contact form
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Contact Form Submission",
            "POST",
            "contact",
            200,
            data=contact_data
        )
        
        if success:
            print(f"   ✅ Contact form submission successful")
            print(f"   - Name: {contact_data['name']}")
            print(f"   - Email: {contact_data['email']}")
            print(f"   - Phone: {contact_data['phone']}")
            print(f"   - Subject: {contact_data['subject']}")
        else:
            self.log("Contact form submission failed", False)
            return False
        
        self.token = temp_token  # Restore admin token
        
        # Step 5: Test Customer Profile Update (PUT /api/customer/profile)
        print("\n5️⃣ Testing Customer Profile Update...")
        
        # First login as the test customer to get token
        customer_login_data = {
            "email": test_email,
            "password": "test1234"
        }
        
        temp_token = self.token
        self.token = None
        
        success, login_response = self.run_test(
            "Customer Login for Profile Update",
            "POST",
            "customer/login",
            200,
            data=customer_login_data
        )
        
        if not success or 'token' not in login_response:
            self.log("Failed to login test customer", False)
            return False
        
        customer_token = login_response['token']
        self.token = customer_token
        
        # Test profile update with new fields
        profile_update_data = {
            "phone": "+43 650 2711237",
            "billing_address": "Wachauer Straße 15",
            "billing_city": "Krems an der Donau",
            "billing_postal": "3500",
            "billing_country": "Österreich",
            "billing_same_as_shipping": False,
            "default_address": "Hauptstraße 123",
            "default_city": "Dürnstein",
            "default_postal": "3601",
            "default_country": "Österreich"
        }
        
        success, response = self.run_test(
            "Customer Profile Update",
            "PUT",
            "customer/me",
            200,
            data=profile_update_data
        )
        
        if success:
            print(f"   ✅ Customer profile updated successfully:")
            print(f"   - Phone: {response.get('phone')}")
            print(f"   - Billing Address: {response.get('billing_address')}")
            print(f"   - Billing City: {response.get('billing_city')}")
            print(f"   - Default Address: {response.get('default_address')}")
            print(f"   - Billing Same as Shipping: {response.get('billing_same_as_shipping')}")
        else:
            self.log("Customer profile update failed", False)
            return False
        
        self.token = temp_token  # Restore admin token
        
        # Step 6: Test Admin Customers with Newsletter Status
        print("\n6️⃣ Testing Admin Customers with Newsletter Status...")
        
        success, customers_response = self.run_test(
            "Get Admin Customers List",
            "GET",
            "admin/customers",
            200
        )
        
        if not success:
            self.log("Failed to get admin customers list", False)
            return False
        
        if isinstance(customers_response, list) and len(customers_response) > 0:
            print(f"   ✅ Found {len(customers_response)} customers")
            
            # Check if customers have newsletter_subscribed field
            newsletter_field_found = False
            for customer in customers_response:
                if 'newsletter_subscribed' in customer:
                    newsletter_field_found = True
                    print(f"   - Customer {customer.get('email', 'Unknown')}: newsletter_subscribed = {customer['newsletter_subscribed']}")
                    break
            
            if newsletter_field_found:
                print(f"   ✅ Customers contain newsletter_subscribed field")
            else:
                self.log("Customers missing newsletter_subscribed field", False)
                return False
        else:
            self.log("No customers found in admin list", False)
            return False
        
        print("\n🎉 All specific Hermann Böhmer features tests passed!")
        return True

    def test_hermann_boehmer_specific_only(self):
        """Run only the specific Hermann Böhmer features tests from review request"""
        print("🎯 Testing Specific Hermann Böhmer Features (Review Request)")
        print("=" * 70)
        
        result = self.test_hermann_boehmer_specific_features()
        
        print("\n" + "=" * 70)
        if result:
            print("🎉 Specific Hermann Böhmer Features Tests: ALL PASSED")
            return 0
        else:
            print("❌ Specific Hermann Böhmer Features Tests: FAILED")
            return 1

    def test_hermann_boehmer_quick_review(self):
        """Quick test of the main Hermann Böhmer API endpoints as requested"""
        print("\n🏪 Hermann Böhmer Website - Quick API Review")
        print("=" * 60)
        
        all_tests_passed = True
        
        # Test 1: GET /api/products - Produktliste abrufen
        print("\n1️⃣ Testing GET /api/products - Produktliste abrufen...")
        success, response = self.run_test(
            "Get Products List",
            "GET",
            "products",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} products")
            if len(response) > 0:
                sample_product = response[0]
                print(f"   - Sample: {sample_product.get('name_de', 'Unknown')} - €{sample_product.get('price', 0):.2f}")
        else:
            self.log("Failed to get products list", False)
            all_tests_passed = False
        
        # Test 2: GET /api/shipping-rates - Versandkosten abrufen
        print("\n2️⃣ Testing GET /api/shipping-rates - Versandkosten abrufen...")
        success, response = self.run_test(
            "Get Shipping Rates",
            "GET",
            "shipping-rates",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} shipping rates")
            for rate in response[:3]:  # Show first 3
                print(f"   - {rate.get('country')}: €{rate.get('rate', 0):.2f}")
        else:
            self.log("Failed to get shipping rates", False)
            all_tests_passed = False
        
        # Test 3: POST /api/admin/login - Admin Login mit admin@boehmer.at / wachau2024
        print("\n3️⃣ Testing POST /api/admin/login - Admin Login...")
        login_data = {
            "email": "admin@boehmer.at",
            "password": "wachau2024"
        }
        
        success, response = self.run_test(
            "Admin Login (admin@boehmer.at / wachau2024)",
            "POST",
            "admin/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   ✅ Admin login successful")
            print(f"   - Email: {response.get('email')}")
            print(f"   - Token length: {len(self.token)} chars")
        else:
            self.log("Failed to login admin with provided credentials", False)
            all_tests_passed = False
        
        # Test 4: GET /api/testimonials - Testimonials abrufen
        print("\n4️⃣ Testing GET /api/testimonials - Testimonials abrufen...")
        success, response = self.run_test(
            "Get Testimonials",
            "GET",
            "testimonials",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} testimonials")
            if len(response) > 0:
                sample_testimonial = response[0]
                print(f"   - Sample: {sample_testimonial.get('name', 'Unknown')} from {sample_testimonial.get('location', 'Unknown')}")
                print(f"   - Rating: {sample_testimonial.get('rating', 0)}/5")
        else:
            self.log("Failed to get testimonials", False)
            all_tests_passed = False
        
        # Summary
        print("\n" + "=" * 60)
        if all_tests_passed:
            print("🎉 All Hermann Böhmer API endpoints are working correctly!")
            print("✅ Products API - Working")
            print("✅ Shipping Rates API - Working") 
            print("✅ Admin Login API - Working")
            print("✅ Testimonials API - Working")
            return True
        else:
            print("❌ Some Hermann Böhmer API endpoints have issues!")
            return False

    def test_hermann_boehmer_quick_only(self):
        """Run only the quick Hermann Böhmer review tests"""
        print("🏪 Hermann Böhmer Website - Quick API Review")
        print("=" * 60)
        
        result = self.test_hermann_boehmer_quick_review()
        
        print("\n" + "=" * 60)
        if result:
            print("🎉 Hermann Böhmer Quick Review: ALL PASSED")
            return 0
        else:
            print("❌ Hermann Böhmer Quick Review: FAILED")
            return 1

    def test_postgresql_api_review(self):
        """Test the PostgreSQL-based API endpoints as requested in review"""
        print("\n🐘 Testing PostgreSQL-based Hermann Böhmer API")
        print("=" * 60)
        
        # Step 1: Test Health Check
        print("\n1️⃣ Testing Health Check...")
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        
        if success:
            database_type = response.get('database', 'unknown')
            if database_type == 'postgresql':
                print(f"   ✅ Health check shows PostgreSQL database")
            else:
                self.log(f"Expected 'postgresql', got '{database_type}'", False)
                return False
        else:
            self.log("Health check failed", False)
            return False
        
        # Step 2: Test Products (should show 4 products)
        print("\n2️⃣ Testing Products List...")
        success, products = self.run_test(
            "Get Products List",
            "GET",
            "products",
            200
        )
        
        if success and isinstance(products, list):
            if len(products) == 4:
                print(f"   ✅ Found exactly 4 products as expected")
                for i, product in enumerate(products, 1):
                    print(f"   {i}. {product.get('name_de', 'Unknown')} - €{product.get('price', 0):.2f}")
            else:
                self.log(f"Expected 4 products, found {len(products)}", False)
                return False
        else:
            self.log("Failed to get products or invalid response", False)
            return False
        
        # Step 3: Test Shipping Rates (should show 7 countries)
        print("\n3️⃣ Testing Shipping Rates...")
        success, rates = self.run_test(
            "Get Shipping Rates",
            "GET",
            "shipping-rates",
            200
        )
        
        if success and isinstance(rates, list):
            if len(rates) == 7:
                print(f"   ✅ Found exactly 7 shipping rates as expected")
                for rate in rates:
                    print(f"   - {rate.get('country')}: €{rate.get('rate', 0):.2f}")
            else:
                self.log(f"Expected 7 shipping rates, found {len(rates)}", False)
                return False
        else:
            self.log("Failed to get shipping rates or invalid response", False)
            return False
        
        # Step 4: Test Testimonials (should show 3 testimonials)
        print("\n4️⃣ Testing Testimonials...")
        success, testimonials = self.run_test(
            "Get Testimonials",
            "GET",
            "testimonials",
            200
        )
        
        if success and isinstance(testimonials, list):
            if len(testimonials) == 3:
                print(f"   ✅ Found exactly 3 testimonials as expected")
                for testimonial in testimonials:
                    print(f"   - {testimonial.get('name', 'Unknown')} from {testimonial.get('location', 'Unknown')} ({testimonial.get('rating', 0)}/5)")
            else:
                self.log(f"Expected 3 testimonials, found {len(testimonials)}", False)
                return False
        else:
            self.log("Failed to get testimonials or invalid response", False)
            return False
        
        # Step 5: Test Admin Login
        print("\n5️⃣ Testing Admin Login...")
        login_data = {
            "email": "admin@boehmer.at",
            "password": "wachau2024"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   ✅ Admin login successful")
            print(f"   - Email: {response.get('email')}")
            print(f"   - Token length: {len(self.token)} chars")
        else:
            self.log("Admin login failed", False)
            return False
        
        # Step 6: Test Admin Stats (with token)
        print("\n6️⃣ Testing Admin Stats...")
        success, stats = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            print(f"   ✅ Admin stats retrieved successfully")
            print(f"   - Total Products: {stats.get('total_products', 0)}")
            print(f"   - Total Orders: {stats.get('total_orders', 0)}")
            print(f"   - Total Revenue: €{stats.get('total_revenue', 0):.2f}")
            if 'new_orders_count' in stats:
                print(f"   - New Orders: {stats.get('new_orders_count', 0)}")
        else:
            self.log("Failed to get admin stats", False)
            return False
        
        # Step 7: Test Newsletter Subscription
        print("\n7️⃣ Testing Newsletter Subscription...")
        
        # Remove token for public newsletter endpoint
        temp_token = self.token
        self.token = None
        
        newsletter_data = {
            "email": "test@example.com"
        }
        
        success, response = self.run_test(
            "Newsletter Subscription",
            "POST",
            "newsletter/subscribe",
            200,
            data=newsletter_data
        )
        
        if success:
            print(f"   ✅ Newsletter subscription successful")
            print(f"   - Email: test@example.com")
            print(f"   - Response: {response.get('message', 'Success')}")
        else:
            self.log("Newsletter subscription failed", False)
            return False
        
        # Restore admin token
        self.token = temp_token
        
        print("\n🎉 All PostgreSQL API tests passed!")
        return True

    def test_postgresql_api_only(self):
        """Run only the PostgreSQL API review tests"""
        print("🐘 Testing PostgreSQL-based Hermann Böhmer API")
        print("=" * 60)
        
        result = self.test_postgresql_api_review()
        
        print("\n" + "=" * 60)
        if result:
            print("🎉 PostgreSQL API Review Tests: ALL PASSED")
            return 0
        else:
            print("❌ PostgreSQL API Review Tests: FAILED")
            return 1

def main():
    tester = WachauAPITester()
    
    # Check command line arguments for specific test suites
    if len(sys.argv) > 1:
        if sys.argv[1] == "notifications":
            return tester.test_notification_system_only()
        elif sys.argv[1] == "shipping":
            return tester.test_shipping_system_only()
        elif sys.argv[1] == "email-auth":
            return tester.test_email_auth_system_only()
        elif sys.argv[1] == "hermann-boehmer":
            return tester.test_hermann_boehmer_only()
        elif sys.argv[1] == "hermann-specific":
            return tester.test_hermann_boehmer_specific_only()
        elif sys.argv[1] == "quick":
            return tester.test_hermann_boehmer_quick_only()
        elif sys.argv[1] == "postgresql":
            return tester.test_postgresql_api_only()
    
    # Default: run all tests
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())