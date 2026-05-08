# Fiksiraj - Booking Platform for Home Service Professionals

## Original Problem Statement
Build a full-stack booking application called "Fiksiraj" for home service professionals in the Balkans (initially focused on Croatia). The application supports two user types:
- **Professionals ("Majstor")**: Register and manage their services, working hours, and bookings
- **Clients**: Book services without registration

## Tech Stack
- **Backend**: FastAPI, MongoDB (motor), Pydantic, JWT authentication, SendGrid (email), Stripe (payments)
- **Frontend**: React, React Router, Tailwind CSS, Shadcn/UI components, Axios
- **Database**: MongoDB

## Core Features (Implemented)

### Phase 1-4: MVP, Search, Reviews, Notifications (Complete)
- Full professional registration and JWT auth
- Service and working hours management
- Public directory with search and filters
- Review and rating system
- SendGrid email notifications
- Password reset functionality

### Phase 5-6: UI Redesign & Mobile Polish (Complete)
- Modern marketplace design
- Mobile-responsive navigation
- Color-coded stat cards
- Delete cancelled bookings

### Phase 7: Final Improvements (Complete - March 2026)

**Landing Page Text:**
- Changed "Pronađite stručnjaka" to "Pronađite majstora"

**Booking Description Feature:**
- Added optional textarea: "Opišite problem (nije obavezno)"
- Placeholder: "Npr. Kada je pukla na rubu, treba popravak ili zamjena..."
- Description stored in booking document
- Description displayed in reservation cards with green background
- Description included in email notifications to professionals

### Phase 8: Major SaaS UI Overhaul (Complete - March 2026)

**Complete Visual Design System:**
- Modern `.app-background` with gradient overlays and floating decorative orbs
- Custom utility classes: `.card-elevated`, `.stat-card`, `.booking-card`, `.hero-card`
- `.btn-primary`, `.btn-success`, `.btn-danger`, `.btn-secondary` with gradient backgrounds, shadows, and hover scale effects
- `.filter-btn-active` / `.filter-btn-inactive` for modern tab styling
- `.status-badge` classes with gradient backgrounds per status (pending/confirmed/cancelled/completed)
- `.form-label`, `.form-input`, `.form-textarea` for consistent form styling
- `.day-row` for working hours with mini-card row appearance

### Phase 12: Stripe Subscription Integration (Complete - May 2026)

**Backend Endpoints:**
- `POST /api/create-checkout-session`: Creates Stripe Checkout session for €10/month subscription
- `GET /api/checkout-status/{session_id}`: Polls payment status and updates subscription
- `POST /api/stripe-webhook`: Handles Stripe webhook events
- `GET /api/subscription-status`: Returns current professional's subscription status

**Webhook Events Handled:**
- `checkout.session.completed`: Activates subscription
- `invoice.payment_succeeded`: Updates recurring payment status
- `customer.subscription.deleted`: Marks subscription as cancelled

**Database Fields Added (professionals collection):**
- `subscription_status`: "active", "cancelled", or null
- `stripe_session_id`: Last checkout session ID
- `subscription_activated_at`: ISO timestamp
- `last_payment_at`: ISO timestamp for recurring payments
- `subscription_cancelled_at`: ISO timestamp when cancelled

**New Collection: `payment_transactions`**
- Stores all checkout sessions with status tracking
- Fields: id, session_id, professional_email, amount, currency, plan_id, payment_status, created_at, updated_at

**Frontend (Dashboard.js):**
- Subscription status card with green "Premium pretplata" header
- Shows €10/mjesečno pricing
- "Aktiviraj pretplatu" button redirects to Stripe Checkout
- Polls payment status on return from Stripe
- Shows "Pretplata aktivna" when subscription is active
- `.price-tag` for prominent price display
- `.description-box` for booking descriptions with green gradient background

**Pages Updated:**
1. **LandingPage.js** - Hero section with badge, gradient headline, glassmorphic search card, modern features grid, dark footer
2. **LoginPage.js** - Centered hero card with input icons (Mail, Lock), arrow button, loading spinner
3. **RegisterPage.js** - Modern form with icons per field, two-column layout for country/city
4. **Dashboard.js** - Stat cards with colored accent lines, gradient icon badges, hover scale effects
5. **BookingsPage.js** - Restructured booking cards with header/body/footer sections, colored info boxes, prominent price tags
6. **WorkingHoursPage.js** - Day rows as mini-cards with abbreviation badges (Pon, Uto), modern toggles and time inputs
7. **ServicesPage.js** - Service cards with gradient icon sections for duration/price, gradient form header
8. **PublicBookingPage.js** - Professional profile with avatar, step indicators, modern service/time selection, success screen

**Navbar.js:**
- Active state highlighting with gradient background
- User avatar badge with initial
- Glassmorphic backdrop blur

**Typography System:**
- `.section-title` with gradient text effect
- `.section-subtitle` for muted descriptions
- Uppercase tracking-wider labels

## Key API Endpoints
- `/api/auth/{register, login, forgot-password, reset-password}`
- `/api/professionals/{search, featured}`
- `/api/majstor/{slug}` - Public professional profile
- `/api/bookings`, `/api/bookings/{id}/{confirm|cancel|complete|delete}`
- `/api/services`, `/api/working-hours`, `/api/days-off`
- `/api/reviews` (POST), `/api/reviews/{token}` (GET)
- `/api/public/{slug}/book` - Create booking (includes description field)

## Database Schema
- **professionals**: User accounts with profession, location, rating
- **bookings**: Client reservations with service details, status, AND description
- **reviews**: Client feedback linked to completed bookings
- **services**: Professional service offerings (name, duration, price)
- **working_hours**: Weekly schedule per professional
- **unavailable_dates**: Days off configuration

## Current Status
Application is production-ready with modern UI, full mobile support, and comprehensive security features.

### Phase 10: Production Readiness Check (Complete - April 2026)

**Authentication & Security:**
- Rate limiting for login (5 attempts/minute per IP+email)
- Rate limiting for registration (5 attempts/5 minutes per IP)
- Rate limiting for booking creation (10 attempts/minute per IP)
- Pydantic validation on all input fields
- Password hashing with bcrypt
- Unique email constraint enforced via MongoDB index

**Backend Validation:**
- Required field validation (name, phone, email)
- Email format validation via EmailStr
- Password minimum length (6 characters)
- Phone number basic validation (min 6 digits)
- Datetime format validation

**Booking System:**
- Double booking prevention (overlap check)
- Past date booking prevention (5 minute grace period)
- Booking statuses: pending, confirmed, cancelled, completed

**Email System:**
- Retry logic (3 attempts with exponential backoff)
- Logging of all email attempts
- Graceful failure handling

**Database:**
- Indexes on: professionals.email (unique), professionals.slug (unique)
- Indexes on: bookings.booking_datetime, bookings.professional_email
- Indexes on: services.professional_email, reviews.professional_email

**Error Handling:**
- Global exception handler for unhandled errors
- Comprehensive try/catch in all endpoints
- User-friendly error messages in Croatian

**Logging:**
- Registration events
- Login events (success/failure)
- Booking creation events
- Email sending events
- Error events with stack traces

## Future Enhancements (Backlog)
- Backend refactoring: Split server.py into modular routers
- Multi-country expansion (Bosnia, Serbia)
- SMS notifications via Twilio
- In-app messaging between clients and professionals
- Payment integration (Stripe)
- Mobile app version
- Analytics dashboard for professionals

---

## Changelog

### Phase 11: Strict Review System (Complete - April 2026)

**Review System Security & Validation:**
- Review link expires after **30 days** with clear Croatian error message
- Review token stored with `review_token_expires` field (ISO datetime)
- Only `status == "completed"` bookings can receive reviews
- Rating validation enforced: must be between 1-5
- **Duplicate prevention**: Unique MongoDB index on `reviews.booking_id` + application-level checks
- Review token is **invalidated (set to null)** after successful submission

**Email Triggers:**
- `send_review_request_email()`: Sent automatically when professional marks booking as "completed"
- `send_review_reminder_email()`: Sent 3 days after completion if no review submitted (scheduler runs every 6 hours)

**Backend Endpoints Updated:**
- `PUT /api/bookings/{id}/complete`: Now generates `review_token`, `review_token_expires` (30 days), sends email to client
- `GET /api/public/review/{booking_id}/{token}`: Returns booking info, validates expiration and reviewed status
- `POST /api/public/review/{booking_id}/{token}`: Submits review with full validation, updates professional rating

**Frontend Updated:**
- `/ocijeni/:bookingId/:token` route for review submission
- Modern SaaS styling consistent with app design
- Error states: Expired link (clock icon), Invalid link (warning icon), Already reviewed (check icon)
- Success state with "Hvala na recenziji!" message
- Star rating with hover effects and validation

**Database Indexes Added:**
- `reviews.booking_id` (unique) - Enforces one review per booking
- `bookings.review_token` - For faster review token lookups

**New Booking Fields:**
- `review_token_expires`: ISO datetime string (30 days from completion)
- `review_reminder_sent`: Boolean flag to track reminder email status
