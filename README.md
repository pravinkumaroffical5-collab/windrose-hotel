# Windrose Hotels — Booking System

## Run
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set `MONGO_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a strong `JWT_SECRET`.
4. `npm start`
5. Open `http://localhost:5000/index.html` or `customer.html`.
6. Admin: `http://localhost:5000/admin.html` and sign in with the credentials from `.env`.

## Important
- Room price, guest limits, dates and availability are validated by the backend.
- Demo payment details are validated in the browser but no real money is charged; bookings are saved as `pending` payment.
- Admin booking data and cancellation endpoints require a signed admin token.
- Never use real card details in this demo. For real payments, integrate Razorpay/Stripe and verify payments server-side before marking a booking as paid.
- Inventory for this demo: Standard 10, Deluxe 5, Executive Suite 2.
