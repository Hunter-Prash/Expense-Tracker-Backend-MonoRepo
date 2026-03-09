import crypto from 'crypto';
import { docClient, TABLE_NAME, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '../db.js';

// ─── Create a category ────────────────────────────────────────────
export const createCategory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'name and type are required' });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'type must be either "income" or "expense"' });
        }

        const categoryId = crypto.randomUUID();
        const now = new Date().toISOString();

        const item = {
            pk: `USER#${userId}`,
            sk: `CAT#${categoryId}`,
            id: categoryId,
            user_id: userId,
            name,
            type,
            created_at: now
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        }));

        return res.status(201).json({ message: 'Category created', category: item });
    } catch (err) {
        console.error('createCategory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get all categories for the logged-in user ───────────────────
export const getCategories = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':prefix': 'CAT#'
            }
        }));

        return res.status(200).json({ categories: result.Items || [] });
    } catch (err) {
        console.error('getCategories error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get a single category by ID ─────────────────────────────────
export const getCategoryById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `USER#${userId}`, sk: `CAT#${id}` }
        }));

        if (!result.Item) {
            return res.status(404).json({ error: 'Category not found' });
        }

        return res.status(200).json({ category: result.Item });
    } catch (err) {
        console.error('getCategoryById error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Update a category ───────────────────────────────────────────
export const updateCategory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, type } = req.body;

        if (!name && !type) {
            return res.status(400).json({ error: 'Provide at least name or type to update' });
        }

        if (type && !['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'type must be either "income" or "expense"' });
        }

        const updates = [];
        const exprNames = {};
        const exprValues = {};

        if (name) {
            updates.push('#n = :name');
            exprNames['#n'] = 'name';
            exprValues[':name'] = name;
        }
        if (type) {
            updates.push('#t = :type');
            exprNames['#t'] = 'type';
            exprValues[':type'] = type;
        }

        const result = await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `USER#${userId}`, sk: `CAT#${id}` },
            UpdateExpression: `SET ${updates.join(', ')}`,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ConditionExpression: 'attribute_exists(pk)',
            ReturnValues: 'ALL_NEW'
        }));

        return res.status(200).json({ message: 'Category updated', category: result.Attributes });
    } catch (err) {
        if (err.name === 'ConditionalCheckFailedException') {
            return res.status(404).json({ error: 'Category not found' });
        }
        console.error('updateCategory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Delete a category ───────────────────────────────────────────
export const deleteCategory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: `USER#${userId}`, sk: `CAT#${id}` },
            ReturnValues: 'ALL_OLD'
        }));

        if (!result.Attributes) {
            return res.status(404).json({ error: 'Category not found' });
        }

        return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error('deleteCategory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
