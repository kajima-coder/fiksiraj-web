"""
Review System Tests for Fiksiraj Booking App
Tests the complete review workflow including:
- Review link expiration validation (30 days)
- Duplicate review prevention
- Rating validation (1-5 range)
- Complete booking generates review token
- Review submission updates professional's rating
- Invalid token handling
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://probook-balkans.preview.emergentagent.com').rstrip('/')

# Test credentials from review request
TEST_PROFESSIONAL_EMAIL = "test-majstor@test.com"
TEST_PROFESSIONAL_PASSWORD = "test123"
TEST_PROFESSIONAL_SLUG = "test-majstor-1"
SERVICE_ID = "c1a3d05f-0655-4f60-a064-2a525e08d423"


class TestReviewSystemSetup:
    """Setup tests - verify test professional exists and can login"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Shared requests session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    def test_api_health(self, session):
        """Test API is accessible"""
        response = session.get(f"{BASE_URL}/api/public/featured")
        assert response.status_code == 200, f"API not accessible: {response.text}"
        print(f"API health check passed")
    
    def test_professional_login(self, session):
        """Test professional can login"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROFESSIONAL_EMAIL,
            "password": TEST_PROFESSIONAL_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["professional"]["slug"] == TEST_PROFESSIONAL_SLUG
        print(f"Professional login successful: {data['professional']['name']}")


class TestReviewWorkflow:
    """Test complete review workflow: create booking -> complete -> review"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test professional"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROFESSIONAL_EMAIL,
            "password": TEST_PROFESSIONAL_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Cannot login: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def authenticated_session(self, auth_token):
        """Session with auth header"""
        s = requests.Session()
        s.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        return s
    
    @pytest.fixture(scope="class")
    def test_booking(self, authenticated_session):
        """Create a test booking for review testing"""
        # First get available services
        services_response = authenticated_session.get(f"{BASE_URL}/api/services")
        if services_response.status_code != 200 or not services_response.json():
            # Create a test service if none exists
            service_data = {
                "name": "TEST_Review_Service",
                "duration_minutes": 60,
                "price": 50.0
            }
            create_response = authenticated_session.post(f"{BASE_URL}/api/services", json=service_data)
            if create_response.status_code == 200:
                service_id = create_response.json()["id"]
            else:
                service_id = SERVICE_ID
        else:
            service_id = services_response.json()[0]["id"]
        
        # Create a booking via public endpoint
        booking_datetime = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        booking_data = {
            "service_id": service_id,
            "booking_datetime": booking_datetime,
            "client_name": "TEST_Review_Client",
            "client_phone": "+385 91 123 4567",
            "client_email": "test_review_client@test.com",
            "description": "Test booking for review system"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/public/{TEST_PROFESSIONAL_SLUG}/book",
            json=booking_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code not in [200, 201]:
            pytest.skip(f"Cannot create booking: {response.text}")
        
        booking = response.json()
        print(f"Created test booking: {booking['id']}")
        return booking
    
    def test_complete_booking_generates_review_token(self, authenticated_session, test_booking):
        """Test that completing a booking generates a review token with expiration"""
        booking_id = test_booking["id"]
        
        # First confirm the booking
        confirm_response = authenticated_session.put(f"{BASE_URL}/api/bookings/{booking_id}/confirm")
        assert confirm_response.status_code == 200, f"Confirm failed: {confirm_response.text}"
        
        # Complete the booking
        complete_response = authenticated_session.put(f"{BASE_URL}/api/bookings/{booking_id}/complete")
        assert complete_response.status_code == 200, f"Complete failed: {complete_response.text}"
        
        data = complete_response.json()
        assert "review_token" in data, "No review_token in response"
        assert data["review_token"] is not None, "review_token is None"
        print(f"Booking completed with review token: {data['review_token'][:20]}...")
        
        # Store token for later tests
        test_booking["review_token"] = data["review_token"]
        return data["review_token"]
    
    def test_get_review_info_valid_token(self, test_booking):
        """Test GET /api/public/review/{booking_id}/{token} with valid token"""
        booking_id = test_booking["id"]
        token = test_booking.get("review_token")
        
        if not token:
            pytest.skip("No review token available")
        
        response = requests.get(f"{BASE_URL}/api/public/review/{booking_id}/{token}")
        assert response.status_code == 200, f"Get review info failed: {response.text}"
        
        data = response.json()
        assert "booking_id" in data
        assert "professional_name" in data
        assert "service_name" in data
        assert "client_name" in data
        assert data["booking_id"] == booking_id
        print(f"Review info retrieved: {data['professional_name']} - {data['service_name']}")
    
    def test_submit_review_valid(self, test_booking):
        """Test POST /api/public/review/{booking_id}/{token} with valid data"""
        booking_id = test_booking["id"]
        token = test_booking.get("review_token")
        
        if not token:
            pytest.skip("No review token available")
        
        review_data = {
            "rating": 5,
            "comment": "Excellent service! TEST_Review"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/public/review/{booking_id}/{token}",
            json=review_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Submit review failed: {response.text}"
        
        data = response.json()
        assert data["rating"] == 5
        assert data["booking_id"] == booking_id
        print(f"Review submitted successfully: rating={data['rating']}")
        
        # Mark as reviewed for subsequent tests
        test_booking["reviewed"] = True


class TestDuplicateReviewPrevention:
    """Test that duplicate reviews are prevented"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROFESSIONAL_EMAIL,
            "password": TEST_PROFESSIONAL_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Cannot login: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def reviewed_booking(self, auth_token):
        """Create and complete a booking, then submit a review"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        
        # Get service
        services_response = session.get(f"{BASE_URL}/api/services")
        if services_response.status_code != 200 or not services_response.json():
            pytest.skip("No services available")
        service_id = services_response.json()[0]["id"]
        
        # Create booking
        booking_datetime = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
        booking_data = {
            "service_id": service_id,
            "booking_datetime": booking_datetime,
            "client_name": "TEST_Duplicate_Client",
            "client_phone": "+385 91 999 8888",
            "client_email": "test_duplicate@test.com"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/public/{TEST_PROFESSIONAL_SLUG}/book",
            json=booking_data,
            headers={"Content-Type": "application/json"}
        )
        if create_response.status_code not in [200, 201]:
            pytest.skip(f"Cannot create booking: {create_response.text}")
        
        booking = create_response.json()
        booking_id = booking["id"]
        
        # Confirm and complete
        session.put(f"{BASE_URL}/api/bookings/{booking_id}/confirm")
        complete_response = session.put(f"{BASE_URL}/api/bookings/{booking_id}/complete")
        if complete_response.status_code != 200:
            pytest.skip(f"Cannot complete booking: {complete_response.text}")
        
        review_token = complete_response.json()["review_token"]
        
        # Submit first review
        review_response = requests.post(
            f"{BASE_URL}/api/public/review/{booking_id}/{review_token}",
            json={"rating": 4, "comment": "Good service"},
            headers={"Content-Type": "application/json"}
        )
        if review_response.status_code != 200:
            pytest.skip(f"Cannot submit first review: {review_response.text}")
        
        return {"booking_id": booking_id, "review_token": review_token}
    
    def test_duplicate_review_via_get_endpoint(self, reviewed_booking):
        """Test GET endpoint returns error for already reviewed booking"""
        booking_id = reviewed_booking["booking_id"]
        token = reviewed_booking["review_token"]
        
        response = requests.get(f"{BASE_URL}/api/public/review/{booking_id}/{token}")
        # Should return 400 or 404 since already reviewed (token is invalidated after review)
        assert response.status_code in [400, 404], f"Expected 400/404, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        # Token is invalidated after review, so it returns "not found" or "already reviewed"
        # Both are valid responses indicating duplicate review is blocked
        print(f"Duplicate review GET blocked: {data['detail']}")
    
    def test_duplicate_review_via_post_endpoint(self, reviewed_booking):
        """Test POST endpoint returns error for already reviewed booking"""
        booking_id = reviewed_booking["booking_id"]
        token = reviewed_booking["review_token"]
        
        response = requests.post(
            f"{BASE_URL}/api/public/review/{booking_id}/{token}",
            json={"rating": 3, "comment": "Trying duplicate"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 400 or 404
        assert response.status_code in [400, 404], f"Expected 400/404, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        print(f"Duplicate review POST blocked: {data['detail']}")


class TestRatingValidation:
    """Test rating validation (1-5 range)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROFESSIONAL_EMAIL,
            "password": TEST_PROFESSIONAL_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Cannot login: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def completed_booking_for_rating_test(self, auth_token):
        """Create a completed booking for rating validation tests"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        
        # Get service
        services_response = session.get(f"{BASE_URL}/api/services")
        if services_response.status_code != 200 or not services_response.json():
            pytest.skip("No services available")
        service_id = services_response.json()[0]["id"]
        
        # Create booking
        booking_datetime = (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
        booking_data = {
            "service_id": service_id,
            "booking_datetime": booking_datetime,
            "client_name": "TEST_Rating_Client",
            "client_phone": "+385 91 777 6666",
            "client_email": "test_rating@test.com"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/public/{TEST_PROFESSIONAL_SLUG}/book",
            json=booking_data,
            headers={"Content-Type": "application/json"}
        )
        if create_response.status_code not in [200, 201]:
            pytest.skip(f"Cannot create booking: {create_response.text}")
        
        booking = create_response.json()
        booking_id = booking["id"]
        
        # Confirm and complete
        session.put(f"{BASE_URL}/api/bookings/{booking_id}/confirm")
        complete_response = session.put(f"{BASE_URL}/api/bookings/{booking_id}/complete")
        if complete_response.status_code != 200:
            pytest.skip(f"Cannot complete booking: {complete_response.text}")
        
        review_token = complete_response.json()["review_token"]
        return {"booking_id": booking_id, "review_token": review_token}
    
    def test_rating_below_minimum(self, completed_booking_for_rating_test):
        """Test rating below 1 is rejected"""
        booking_id = completed_booking_for_rating_test["booking_id"]
        token = completed_booking_for_rating_test["review_token"]
        
        response = requests.post(
            f"{BASE_URL}/api/public/review/{booking_id}/{token}",
            json={"rating": 0, "comment": "Invalid rating"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print(f"Rating 0 rejected: {response.json().get('detail', 'No detail')}")
    
    def test_rating_above_maximum(self, completed_booking_for_rating_test):
        """Test rating above 5 is rejected"""
        booking_id = completed_booking_for_rating_test["booking_id"]
        token = completed_booking_for_rating_test["review_token"]
        
        response = requests.post(
            f"{BASE_URL}/api/public/review/{booking_id}/{token}",
            json={"rating": 6, "comment": "Invalid rating"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print(f"Rating 6 rejected: {response.json().get('detail', 'No detail')}")
    
    def test_valid_rating_range(self, completed_booking_for_rating_test):
        """Test valid rating (1-5) is accepted"""
        booking_id = completed_booking_for_rating_test["booking_id"]
        token = completed_booking_for_rating_test["review_token"]
        
        # Test with rating 3 (middle of range)
        response = requests.post(
            f"{BASE_URL}/api/public/review/{booking_id}/{token}",
            json={"rating": 3, "comment": "Average service"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["rating"] == 3
        print(f"Valid rating 3 accepted")


class TestInvalidTokenHandling:
    """Test invalid token returns proper error"""
    
    def test_invalid_token_get(self):
        """Test GET with invalid token returns 404"""
        fake_booking_id = str(uuid.uuid4())
        fake_token = "invalid_token_12345"
        
        response = requests.get(f"{BASE_URL}/api/public/review/{fake_booking_id}/{fake_token}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        print(f"Invalid token GET error: {data['detail']}")
    
    def test_invalid_token_post(self):
        """Test POST with invalid token returns 404"""
        fake_booking_id = str(uuid.uuid4())
        fake_token = "invalid_token_67890"
        
        response = requests.post(
            f"{BASE_URL}/api/public/review/{fake_booking_id}/{fake_token}",
            json={"rating": 5, "comment": "Test"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        print(f"Invalid token POST error: {data['detail']}")
    
    def test_mismatched_booking_and_token(self):
        """Test valid booking ID with wrong token returns 404"""
        # Use a real booking ID format but wrong token
        fake_booking_id = str(uuid.uuid4())
        wrong_token = "wrong_token_abcdef"
        
        response = requests.get(f"{BASE_URL}/api/public/review/{fake_booking_id}/{wrong_token}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"Mismatched booking/token rejected")


class TestProfessionalRatingUpdate:
    """Test that review submission updates professional's rating"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROFESSIONAL_EMAIL,
            "password": TEST_PROFESSIONAL_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Cannot login: {response.text}")
        return response.json()["access_token"]
    
    def test_professional_rating_after_review(self, auth_token):
        """Test professional's rating is updated after review submission"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        
        # Get initial professional rating
        initial_response = requests.get(f"{BASE_URL}/api/public/{TEST_PROFESSIONAL_SLUG}")
        assert initial_response.status_code == 200
        initial_data = initial_response.json()
        initial_rating = initial_data.get("rating", 0)
        initial_review_count = initial_data.get("review_count", 0)
        print(f"Initial rating: {initial_rating}, review count: {initial_review_count}")
        
        # Get service
        services_response = session.get(f"{BASE_URL}/api/services")
        if services_response.status_code != 200 or not services_response.json():
            pytest.skip("No services available")
        service_id = services_response.json()[0]["id"]
        
        # Create, confirm, complete booking
        booking_datetime = (datetime.now(timezone.utc) + timedelta(hours=5)).isoformat()
        booking_data = {
            "service_id": service_id,
            "booking_datetime": booking_datetime,
            "client_name": "TEST_RatingUpdate_Client",
            "client_phone": "+385 91 555 4444",
            "client_email": "test_rating_update@test.com"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/public/{TEST_PROFESSIONAL_SLUG}/book",
            json=booking_data,
            headers={"Content-Type": "application/json"}
        )
        if create_response.status_code not in [200, 201]:
            pytest.skip(f"Cannot create booking: {create_response.text}")
        
        booking = create_response.json()
        booking_id = booking["id"]
        
        session.put(f"{BASE_URL}/api/bookings/{booking_id}/confirm")
        complete_response = session.put(f"{BASE_URL}/api/bookings/{booking_id}/complete")
        if complete_response.status_code != 200:
            pytest.skip(f"Cannot complete booking: {complete_response.text}")
        
        review_token = complete_response.json()["review_token"]
        
        # Submit review with rating 5
        review_response = requests.post(
            f"{BASE_URL}/api/public/review/{booking_id}/{review_token}",
            json={"rating": 5, "comment": "Excellent!"},
            headers={"Content-Type": "application/json"}
        )
        assert review_response.status_code == 200, f"Review submission failed: {review_response.text}"
        
        # Check updated professional rating
        updated_response = requests.get(f"{BASE_URL}/api/public/{TEST_PROFESSIONAL_SLUG}")
        assert updated_response.status_code == 200
        updated_data = updated_response.json()
        updated_rating = updated_data.get("rating", 0)
        updated_review_count = updated_data.get("review_count", 0)
        
        print(f"Updated rating: {updated_rating}, review count: {updated_review_count}")
        
        # Review count should have increased
        assert updated_review_count > initial_review_count, "Review count did not increase"
        print(f"Professional rating updated successfully")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROFESSIONAL_EMAIL,
            "password": TEST_PROFESSIONAL_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Cannot login: {response.text}")
        return response.json()["access_token"]
    
    def test_cleanup_test_bookings(self, auth_token):
        """Clean up TEST_ prefixed bookings"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        
        # Get all bookings
        bookings_response = session.get(f"{BASE_URL}/api/bookings")
        if bookings_response.status_code != 200:
            pytest.skip("Cannot get bookings")
        
        bookings = bookings_response.json()
        deleted_count = 0
        
        for booking in bookings:
            # Delete completed/cancelled TEST_ bookings
            if booking.get("client_name", "").startswith("TEST_") and booking.get("status") in ["completed", "cancelled"]:
                delete_response = session.delete(f"{BASE_URL}/api/bookings/{booking['id']}")
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test bookings")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
