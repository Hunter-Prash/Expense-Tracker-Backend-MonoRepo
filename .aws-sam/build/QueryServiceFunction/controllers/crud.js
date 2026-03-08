import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// ─── Register a new user ───────────────────────────────────────────
export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email and password are required' });
        }

        // Check if user already exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'A user with this email already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
            [name, email, password_hash]
        );

        const user = result.rows[0];

        // Generate a JWT so the user is logged-in immediately after registration
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        return res.status(201).json({ message: 'User registered successfully', user, token });
    } catch (err) {
        console.error('createUser error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Login (get user + token) ──────────────────────────────────────
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        return res.status(200).json({
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at },
            token
        });
    } catch (err) {
        console.error('loginUser error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get current user profile (protected) ──────────────────────────
export const getUser = async (req, res) => {
    try {
        const userId = req.user.id; // set by JWT middleware

        const result = await query(
            'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error('getUser error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Update user profile (protected) ──────────────────────────────
export const updateUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email } = req.body;

        if (!name && !email) {
            return res.status(400).json({ error: 'Provide at least name or email to update' });
        }

        const result = await query(
            `UPDATE users
             SET name       = COALESCE($1, name),
                 email      = COALESCE($2, email),
                 updated_at = NOW()
             WHERE id = $3
             RETURNING id, name, email, created_at, updated_at`,
            [name || null, email || null, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'User updated', user: result.rows[0] });
    } catch (err) {
        console.error('updateUser error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Delete user (protected) ──────────────────────────────────────
export const deleteUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('deleteUser error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
