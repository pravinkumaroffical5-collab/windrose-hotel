const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, comment } = req.body || {};
    if (!name || String(name).trim().length < 2 || !/^[6-9]\d{9}$/.test(String(phone || '').trim()) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())) return res.status(400).json({ error: 'Please enter valid contact details' });
    const contact = await Contact.create({ name: String(name).trim(), phone: String(phone).trim(), email: String(email).trim().toLowerCase(), comment: String(comment || '').trim().slice(0, 1000) });
    res.status(201).json(contact);
  } catch (err) { res.status(400).json({ error: 'Unable to save contact message' }); }
});

router.get('/', async (req, res) => {
  try { const contacts = await Contact.find().sort({ createdAt: -1 }).lean(); res.json(contacts); }
  catch (err) { res.status(500).json({ error: 'Failed to load messages' }); }
});
module.exports = router;
