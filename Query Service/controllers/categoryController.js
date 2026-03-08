import { query } from '../db.js';

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

        const result = await query(
            'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING *',
            [userId, name, type]
        );

        return res.status(201).json({ message: 'Category created', category: result.rows[0] });
    } catch (err) {
        console.error('createCategory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get all categories for the logged-in user ───────────────────
export const getCategories = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            'SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        return res.status(200).json({ categories: result.rows });
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

        const result = await query(
            'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        return res.status(200).json({ category: result.rows[0] });
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

        const result = await query(
            `UPDATE categories
             SET name = COALESCE($1, name),
                 type = COALESCE($2, type)
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [name || null, type || null, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        return res.status(200).json({ message: 'Category updated', category: result.rows[0] });
    } catch (err) {
        console.error('updateCategory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Delete a category ───────────────────────────────────────────
export const deleteCategory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await query(
            'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error('deleteCategory error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
