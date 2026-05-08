import requests
import sys
from datetime import datetime, date
import json

class FiksirajAPITester:
    def __init__(self, base_url="https://probook-balkans.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.professional_slug = None
        self.service_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            result = {
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result['response_data'] = response.json()
                except:
                    result['response_data'] = response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    result['error_data'] = response.json()
                    print(f"   Error details: {response.json()}")
                except:
                    result['error_data'] = response.text
                    print(f"   Error text: {response.text}")

            self.test_results.append(result)
            return success, result.get('response_data', {})

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'error_data': str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_professional_registration(self):
        """Test professional registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "name": f"Ivan Horvat {timestamp}",
            "profession": "Vodovodčar", 
            "phone": "+385 91 234 5678",
            "email": f"ivan.horvat{timestamp}@test.hr",
            "password": "testpassword123"
        }
        
        success, response = self.run_test(
            "Professional Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'professional' in response:
                self.professional_slug = response['professional']['slug']
                print(f"   Professional slug: {self.professional_slug}")
            return True, test_data
        return False, test_data

    def test_professional_login(self, email, password):
        """Test professional login"""
        success, response = self.run_test(
            "Professional Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_current_professional(self):
        """Test getting current professional info"""
        success, response = self.run_test(
            "Get Current Professional",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_service(self):
        """Test creating a service"""
        service_data = {
            "name": "Popravak slavine",
            "duration_minutes": 60,
            "price": 50.00
        }
        
        success, response = self.run_test(
            "Create Service",
            "POST",
            "services",
            200,
            data=service_data
        )
        
        if success and 'id' in response:
            self.service_id = response['id']
            print(f"   Service ID: {self.service_id}")
            return True
        return False

    def test_get_services(self):
        """Test getting services"""
        success, response = self.run_test(
            "Get Services",
            "GET",
            "services",
            200
        )
        return success

    def test_update_service(self):
        """Test updating a service"""
        if not self.service_id:
            print("⚠️ Skipping service update - no service ID available")
            return False
            
        updated_data = {
            "name": "Popravak slavine - Ažurirano",
            "duration_minutes": 90,
            "price": 75.00
        }
        
        success, response = self.run_test(
            "Update Service",
            "PUT",
            f"services/{self.service_id}",
            200,
            data=updated_data
        )
        return success

    def test_get_working_hours(self):
        """Test getting working hours"""
        success, response = self.run_test(
            "Get Working Hours",
            "GET",
            "working-hours",
            200
        )
        return success

    def test_update_working_hours(self):
        """Test updating working hours"""
        working_hours_data = {
            "monday": {"enabled": True, "start_time": "09:00", "end_time": "17:00"},
            "tuesday": {"enabled": True, "start_time": "09:00", "end_time": "17:00"},
            "wednesday": {"enabled": True, "start_time": "09:00", "end_time": "17:00"},
            "thursday": {"enabled": True, "start_time": "09:00", "end_time": "17:00"},
            "friday": {"enabled": True, "start_time": "09:00", "end_time": "17:00"},
            "saturday": {"enabled": False, "start_time": None, "end_time": None},
            "sunday": {"enabled": False, "start_time": None, "end_time": None}
        }
        
        success, response = self.run_test(
            "Update Working Hours",
            "PUT",
            "working-hours",
            200,
            data=working_hours_data
        )
        return success

    def test_add_day_off(self):
        """Test adding a day off"""
        tomorrow = date.today().replace(day=date.today().day + 1)
        day_off_data = {
            "date": tomorrow.strftime("%Y-%m-%d"),
            "reason": "Test odmor"
        }
        
        success, response = self.run_test(
            "Add Day Off",
            "POST",
            "days-off",
            200,
            data=day_off_data
        )
        return success

    def test_get_days_off(self):
        """Test getting days off"""
        success, response = self.run_test(
            "Get Days Off",
            "GET",
            "days-off",
            200
        )
        return success

    def test_get_bookings(self):
        """Test getting bookings"""
        success, response = self.run_test(
            "Get Bookings",
            "GET",
            "bookings",
            200
        )
        return success

    def test_public_profile(self):
        """Test getting public profile"""
        if not self.professional_slug:
            print("⚠️ Skipping public profile test - no slug available")
            return False
            
        success, response = self.run_test(
            "Get Public Profile",
            "GET",
            f"public/{self.professional_slug}",
            200
        )
        return success

    def test_available_slots(self):
        """Test getting available slots"""
        if not self.professional_slug or not self.service_id:
            print("⚠️ Skipping available slots test - no slug or service ID available")
            return False
            
        tomorrow = date.today().replace(day=date.today().day + 1)
        success, response = self.run_test(
            "Get Available Slots",
            "GET",
            f"public/{self.professional_slug}/available-slots",
            200,
            data={
                "date": tomorrow.strftime("%Y-%m-%d"),
                "service_id": self.service_id
            }
        )
        return success

    def test_create_booking(self):
        """Test creating a public booking"""
        if not self.professional_slug or not self.service_id:
            print("⚠️ Skipping booking creation test - no slug or service ID available")
            return False
            
        # Get available slots first
        tomorrow = date.today().replace(day=date.today().day + 1)
        slots_success, slots_response = self.run_test(
            "Get Slots for Booking",
            "GET",
            f"public/{self.professional_slug}/available-slots",
            200,
            data={
                "date": tomorrow.strftime("%Y-%m-%d"),
                "service_id": self.service_id
            }
        )
        
        if not slots_success or not slots_response.get('slots'):
            print("⚠️ No available slots for booking test")
            return False
            
        first_slot = slots_response['slots'][0]
        booking_data = {
            "service_id": self.service_id,
            "booking_datetime": first_slot,
            "client_name": "Marko Marković",
            "client_phone": "+385 91 987 6543"
        }
        
        success, response = self.run_test(
            "Create Public Booking",
            "POST",
            f"public/{self.professional_slug}/book",
            200,
            data=booking_data
        )
        return success

    def test_delete_service(self):
        """Test deleting a service"""
        if not self.service_id:
            print("⚠️ Skipping service deletion - no service ID available")
            return False
            
        success, response = self.run_test(
            "Delete Service",
            "DELETE",
            f"services/{self.service_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Fiksiraj API Tests\n")
    tester = FiksirajAPITester()

    # Test professional registration and authentication
    registration_success, test_user_data = tester.test_professional_registration()
    if not registration_success:
        print("❌ Registration failed, stopping authentication tests")
        return 1

    # Test login with the registered user
    login_success = tester.test_professional_login(test_user_data['email'], test_user_data['password'])
    if not login_success:
        print("❌ Login failed, some tests may not work")

    # Test getting current professional
    tester.test_get_current_professional()

    # Test service management
    tester.test_create_service()
    tester.test_get_services()
    tester.test_update_service()

    # Test working hours
    tester.test_get_working_hours()
    tester.test_update_working_hours()

    # Test days off
    tester.test_add_day_off()
    tester.test_get_days_off()

    # Test bookings
    tester.test_get_bookings()

    # Test public endpoints
    tester.test_public_profile()
    tester.test_available_slots()
    tester.test_create_booking()

    # Clean up - delete service
    tester.test_delete_service()

    # Print results summary
    print(f"\n📊 Test Results Summary:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Print failed tests
    failed_tests = [test for test in tester.test_results if not test['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['name']}: Expected {test['expected_status']}, got {test['actual_status']}")
    else:
        print(f"\n✅ All tests passed!")

    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())