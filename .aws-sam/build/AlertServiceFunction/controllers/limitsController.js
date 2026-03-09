import { query } from '../db.js';

// ─── Set daily limit ─────────────────────────────────────────────
export const setDailyLimit = async (req, res) => {
    try {
        const userId = req.user.id;
        const { daily_limit } = req.body;

        if (daily_limit === undefined || daily_limit === null) {
            return res.status(400).json({ error: 'daily_limit is required' });
        }

        if (isNaN(daily_limit) || Number(daily_limit) < 0) {
            return res.status(400).json({ error: 'daily_limit must be a non-negative number' });
        }

        const existing = await query(`SELECT id FROM limits WHERE user_id = ${userId}`);

        if (existing.rows.length > 0) {
            const result = await query(
                `UPDATE limits SET daily_limit = ${daily_limit}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId} RETURNING *`
            );
            return res.status(200).json({ message: 'Daily limit updated', limits: result.rows[0] });
        } else {
            const result = await query(
                `INSERT INTO limits (user_id, daily_limit) VALUES (${userId}, ${daily_limit}) RETURNING *`
            );
            return res.status(201).json({ message: 'Daily limit set', limits: result.rows[0] });
        }
    } catch (err) {
        console.error('setDailyLimit error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Set weekly limit ────────────────────────────────────────────
export const setWeeklyLimit = async (req, res) => {
    try {
        const userId = req.user.id;
        const { weekly_limit } = req.body;

        if (weekly_limit === undefined || weekly_limit === null) {
            return res.status(400).json({ error: 'weekly_limit is required' });
        }

        if (isNaN(weekly_limit) || Number(weekly_limit) < 0) {
            return res.status(400).json({ error: 'weekly_limit must be a non-negative number' });
        }

        const existing = await query(`SELECT id FROM limits WHERE user_id = ${userId}`);

        if (existing.rows.length > 0) {
            const result = await query(
                `UPDATE limits SET weekly_limit = ${weekly_limit}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId} RETURNING *`
            );
            return res.status(200).json({ message: 'Weekly limit updated', limits: result.rows[0] });
        } else {
            const result = await query(
                `INSERT INTO limits (user_id, weekly_limit) VALUES (${userId}, ${weekly_limit}) RETURNING *`
            );
            return res.status(201).json({ message: 'Weekly limit set', limits: result.rows[0] });
        }
    } catch (err) {
        console.error('setWeeklyLimit error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Set monthly limit ───────────────────────────────────────────
export const setMonthlyLimit = async (req, res) => {
    try {
        const userId = req.user.id;
        const { monthly_limit } = req.body;

        if (monthly_limit === undefined || monthly_limit === null) {
            return res.status(400).json({ error: 'monthly_limit is required' });
        }

        if (isNaN(monthly_limit) || Number(monthly_limit) < 0) {
            return res.status(400).json({ error: 'monthly_limit must be a non-negative number' });
        }

        const existing = await query(`SELECT id FROM limits WHERE user_id = ${userId}`);

        if (existing.rows.length > 0) {
            const result = await query(
                `UPDATE limits SET monthly_limit = ${monthly_limit}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId} RETURNING *`
            );
            return res.status(200).json({ message: 'Monthly limit updated', limits: result.rows[0] });
        } else {
            const result = await query(
                `INSERT INTO limits (user_id, monthly_limit) VALUES (${userId}, ${monthly_limit}) RETURNING *`
            );
            return res.status(201).json({ message: 'Monthly limit set', limits: result.rows[0] });
        }
    } catch (err) {
        console.error('setMonthlyLimit error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get limits for the logged-in user ───────────────────────────
export const getLimits = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(`SELECT * FROM limits WHERE user_id = ${userId}`);

        if (result.rows.length === 0) {
            return res.status(200).json({ limits: { daily_limit: null, weekly_limit: null, monthly_limit: null } });
        }

        return res.status(200).json({ limits: result.rows[0] });
    } catch (err) {
        console.error('getLimits error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Delete limits (reset) ──────────────────────────────────────
export const deleteLimits = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(`DELETE FROM limits WHERE user_id = ${userId} RETURNING id`);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No limits found to delete' });
        }

        return res.status(200).json({ message: 'Limits deleted successfully' });
    } catch (err) {
        console.error('deleteLimits error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
