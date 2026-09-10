const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

const ROOM_PRICES = {
  'Standard Room': 2100,
  'Deluxe Room': 3200,
  'Executive Suite': 5800,
};
const ROOM_CAPACITY = {
  'Standard Room': 2,
  'Deluxe Room': 3,
  'Executive Suite': 4,
};
const ROOM_INVENTORY = {
  'Standard Room': 10,
  'Deluxe Room': 5,
  'Executive Suite': 2,
};

function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validPhone(v) { return /^[6-9]\d{9}$/.test(v); }
function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

// CUSTOMER: create a booking. Price, dates, capacity and availability are always checked on the server.
router.post('/', async (req, res) => {
  try {
    const { customerName, email, phone, roomType, checkIn, checkOut, guests, paymentMethod } = req.body;
    const price = ROOM_PRICES[roomType];
    const capacity = ROOM_CAPACITY[roomType];
    const inventory = ROOM_INVENTORY[roomType];
    if (!price) return res.status(400).json({ error: 'Invalid room type' });
    if (!customerName || customerName.trim().length < 2 || customerName.trim().length > 100) return res.status(400).json({ error: 'Please enter a valid name' });
    if (!validEmail(String(email || '').trim())) return res.status(400).json({ error: 'Please enter a valid email' });
    if (!validPhone(String(phone || '').trim())) return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number' });
    const inDate = startOfDay(checkIn);
    const outDate = startOfDay(checkOut);
    const today = startOfDay(new Date());
    if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime()) || inDate < today || outDate <= inDate) return res.status(400).json({ error: 'Invalid stay dates' });
    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > capacity) return res.status(400).json({ error: `Maximum guests for ${roomType} is ${capacity}` });

    const overlapping = await Booking.countDocuments({
      roomType, status: 'confirmed',
      checkIn: { $lt: outDate },
      checkOut: { $gt: inDate },
    });
    if (overlapping >= inventory) return res.status(409).json({ error: 'Sorry, this room type is fully booked for the selected dates' });

    const nights = Math.round((outDate - inDate) / 86400000);
    const totalPrice = price * nights;
    const safeMethod = typeof paymentMethod === 'string' ? paymentMethod.slice(0, 80) : 'Demo Payment';

    // This project has no real payment gateway. Do not mark demo payments as paid.
    const booking = await Booking.create({
      customerName: customerName.trim(), email: email.trim(), phone: phone.trim(), roomType,
      checkIn: inDate, checkOut: outDate, guests: guestCount, totalPrice,
      paymentStatus: 'pending', paymentMethod: safeMethod, status: 'confirmed'
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: get all bookings (protected in server.js)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// ADMIN: cancel a booking
router.put('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, { status: 'cancelled' }, { new: true, runValidators: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: 'Invalid booking ID' });
  }
});

module.exports = router;
