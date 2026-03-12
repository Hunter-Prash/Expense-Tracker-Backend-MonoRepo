import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { docClient, USERS_TABLE, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '../db.js';
import { toISTISOString } from '../utils/time.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// ─── Register a new user ───────────────────────────────────────────
export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email and password are required' });
        }

        // Check if email already exists using GSI on Users table
        const existing = await docClient.send(new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        }));

        if (existing.Items && existing.Items.length > 0) {
            return res.status(409).json({ error: 'A user with this email already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const userId = crypto.randomUUID();
        const now = toISTISOString();

        // Save in Users table
        // Partition Key: id
        await docClient.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: {
                id: userId,
                name,
                email,
                password_hash,
                created_at: now,
                updated_at: now
            }
        }));

        const user = { id: userId, name, email, created_at: now };
        const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });

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

        // Query by email using GSI
        const result = await docClient.send(new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        }));

        if (!result.Items || result.Items.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password / User not found in DB' });
        }

        const user = result.Items[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid  password' });
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
        const userId = req.user.id;

        const result = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { id: userId }
        }));

        if (!result.Item) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { id, name, email, created_at, updated_at } = result.Item;
        return res.status(200).json({ user: { id, name, email, created_at, updated_at } });
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

        const updates = [];
        const exprNames = {};
        const exprValues = { ':now': toISTISOString() };

        if (name) {
            updates.push('#n = :name');
            exprNames['#n'] = 'name';
            exprValues[':name'] = name;
        }
        if (email) {
            updates.push('email = :email');
            exprValues[':email'] = email;
        }
        updates.push('updated_at = :now');

        const result = await docClient.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { id: userId },
            UpdateExpression: `SET ${updates.join(', ')}`,
            ExpressionAttributeNames: Object.keys(exprNames).length > 0 ? exprNames : undefined,
            ExpressionAttributeValues: exprValues,
            ReturnValues: 'ALL_NEW'
        }));

        const { id: uid, name: n, email: e, created_at, updated_at } = result.Attributes;
        return res.status(200).json({ message: 'User updated', user: { id: uid, name: n, email: e, created_at, updated_at } });
    } catch (err) {
        console.error('updateUser error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Delete user (protected) ──────────────────────────────────────
export const deleteUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await docClient.send(new DeleteCommand({
            TableName: USERS_TABLE,
            Key: { id: userId },
            ReturnValues: 'ALL_OLD'
        }));

        if (!result.Attributes) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('deleteUser error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
