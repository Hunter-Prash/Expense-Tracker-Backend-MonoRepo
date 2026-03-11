import { docClient, LIMITS_TABLE, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '../db.js';

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

        const result = await docClient.send(new UpdateCommand({
            TableName: LIMITS_TABLE,
            // Partition Key: user_id
            Key: { user_id: userId },
            UpdateExpression: 'SET daily_limit = :val, updated_at = :now',
            ExpressionAttributeValues: {
                ':val': Number(daily_limit),
                ':now': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        }));

        return res.status(200).json({ message: 'Daily limit updated', limits: result.Attributes });
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

        const result = await docClient.send(new UpdateCommand({
            TableName: LIMITS_TABLE,
            Key: { user_id: userId },
            UpdateExpression: 'SET weekly_limit = :val, updated_at = :now',
            ExpressionAttributeValues: {
                ':val': Number(weekly_limit),
                ':now': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        }));

        return res.status(200).json({ message: 'Weekly limit updated', limits: result.Attributes });
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

        const result = await docClient.send(new UpdateCommand({
            TableName: LIMITS_TABLE,
            Key: { user_id: userId },
            UpdateExpression: 'SET monthly_limit = :val, updated_at = :now',
            ExpressionAttributeValues: {
                ':val': Number(monthly_limit),
                ':now': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        }));

        return res.status(200).json({ message: 'Monthly limit updated', limits: result.Attributes });
    } catch (err) {
        console.error('setMonthlyLimit error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get limits for the logged-in user ───────────────────────────
export const getLimits = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await docClient.send(new GetCommand({
            TableName: LIMITS_TABLE,
            Key: { user_id: userId }
        }));

        if (!result.Item) {
            return res.status(200).json({ limits: { daily_limit: null, weekly_limit: null, monthly_limit: null } });
        }

        return res.status(200).json({ limits: result.Item });
    } catch (err) {
        console.error('getLimits error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Delete limits (reset) ──────────────────────────────────────
export const deleteLimits = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await docClient.send(new DeleteCommand({
            TableName: LIMITS_TABLE,
            Key: { user_id: userId },
            ReturnValues: 'ALL_OLD'
        }));

        if (!result.Attributes) {
            return res.status(404).json({ error: 'No limits found to delete' });
        }

        return res.status(200).json({ message: 'Limits deleted successfully' });
    } catch (err) {
        console.error('deleteLimits error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
