import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const db = await getDb();
    let user;
    let table;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const emailTrim = email.trim();
    const passwordTrim = password.trim();

    let actualRole = role;

    if (role === 'farmer') {
      user = await db.get(`SELECT * FROM farmers WHERE LOWER(email) = LOWER(?) OR mobile = ? OR LOWER(name) = LOWER(?)`, [emailTrim, emailTrim, emailTrim]);
      if (!user) {
        // Fallback to company
        user = await db.get(`SELECT * FROM companies WHERE LOWER(email) = LOWER(?) OR mobile = ? OR LOWER(name) = LOWER(?)`, [emailTrim, emailTrim, emailTrim]);
        if (user) actualRole = 'company';
      }
    } else if (role === 'company') {
      user = await db.get(`SELECT * FROM companies WHERE LOWER(email) = LOWER(?) OR mobile = ? OR LOWER(name) = LOWER(?)`, [emailTrim, emailTrim, emailTrim]);
      if (!user) {
        // Fallback to farmer
        user = await db.get(`SELECT * FROM farmers WHERE LOWER(email) = LOWER(?) OR mobile = ? OR LOWER(name) = LOWER(?)`, [emailTrim, emailTrim, emailTrim]);
        if (user) actualRole = 'farmer';
      }
    } else if (role === 'government') {
      user = await db.get(`SELECT * FROM government_admins WHERE LOWER(username) = LOWER(?)`, [emailTrim]);
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found. Please check your credentials and role.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, role: actualRole, name: user.name || user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name || user.username,
        role: actualRole,
        email: user.email,
        // Add specific fields based on role
        landId: user.land_id,
        registrationNumber: user.registration_number,
        approved: user.approved
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { role, password, ...data } = req.body;
    const db = await getDb();

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'farmer') {
      const { name, email, mobile, aadhaar, landSize, landId, bankDetails, currentCrop, aadhaar_doc, land_doc, bank_doc } = data;
      const id = `f_${Date.now()}`;

      await db.run(
        `INSERT INTO farmers (id, name, email, mobile, password, aadhaar, land_size, land_id, bank_details, current_crop, aadhaar_doc, land_doc, bank_doc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name.trim(), email.trim(), mobile.trim(), hashedPassword, aadhaar.trim(), landSize, landId.trim(), bankDetails.trim(), (currentCrop || 'wheat').trim(), aadhaar_doc, land_doc, bank_doc]
      );

      const token = jwt.sign({ id, role, name: name.trim() }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, token, user: { id, name: name.trim(), role } });

    } else if (role === 'company') {
      const { name, email, mobile, registrationNumber, requiredCC, registration_doc } = data;
      const id = `c_${Date.now()}`;

      await db.run(
        `INSERT INTO companies (id, name, email, mobile, password, registration_number, required_cc, registration_doc, request_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name.trim(), email.trim(), mobile.trim(), hashedPassword, registrationNumber.trim(), requiredCC, registration_doc, 'none']
      );

      const token = jwt.sign({ id, role, name: name.trim() }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, token, user: { id, name: name.trim(), role } });
    } else {
      return res.status(400).json({ error: 'Invalid role for signup' });
    }

  } catch (error: any) {
    console.error('Signup error:', error);

    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('farmers.email') || error.message.includes('companies.email')) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (error.message.includes('item.mobile')) {
        return res.status(400).json({ error: 'Mobile number already registered' });
      }
      if (error.message.includes('item.aadhaar')) {
        return res.status(400).json({ error: 'Aadhaar number already registered' });
      }
      if (error.message.includes('item.registration_number')) {
        return res.status(400).json({ error: 'Registration number already exists' });
      }
      return res.status(400).json({ error: 'Account with these details already exists (Duplicate Entry)' });
    }

    res.status(500).json({ error: error.message || 'Error creating account' });
  }
});

export default router;
