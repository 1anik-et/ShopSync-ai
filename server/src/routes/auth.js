const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../models/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Mock OTP Store cache: { phone: { otp, expires } }
const otpStore = {};

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, age, height, weight, skinColor, gender } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name,
        age: age ? parseInt(age) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        skinColor: skinColor || null,
        gender: gender || null
      }
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, age: user.age, height: user.height, weight: user.weight, skinColor: user.skinColor, gender: user.gender } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, age: user.age, height: user.height, weight: user.weight, skinColor: user.skinColor, gender: user.gender } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/request-otp
router.post('/request-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    
    // In a real app we'd trigger Twilio/AWS SNS here.
    console.log(`\n========================================`);
    console.log(`[TEST MODE] Generated OTP for ${phone}: ${otp}`);
    console.log(`========================================\n`);

    res.json({ message: 'OTP generated successfully. Check terminal for testing.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

    const record = otpStore[phone];
    if (!record || record.otp !== otp || Date.now() > record.expires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    delete otpStore[phone];

    let user = await prisma.user.findFirst({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: 'Phone User' }
      });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
