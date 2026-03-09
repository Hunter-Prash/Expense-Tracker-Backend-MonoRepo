import crypto from 'crypto';
import { docClient, TABLE_NAME, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '../db.js';

// ─── Create a transaction ─────────────────────────────────────────
export const createTransaction = async (req, res) => {
    try {
        const { amount, transaction_date, description, type, category_name } = req.body;
        const user_id = req.user.id;

        if (!amount || !transaction_date || !type || !category_name) {
            return res.status(400).json({ error: "Amount, transaction_date, type, and category_name are required" });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: "Type must be either 'income' or 'expense'" });
        }

        // Find or create the category
        const catResult = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: '#n = :name AND #t = :type',
            ExpressionAttributeNames: { '#n': 'name', '#t': 'type' },
            ExpressionAttributeValues: {
                ':pk': `USER#${user_id}`,
                ':prefix': 'CAT#',
                ':name': category_name,
                ':type': type
            }
        }));

        let category_id;
        if (catResult.Items && catResult.Items.length > 0) {
            category_id = catResult.Items[0].id;
        } else {
            category_id = crypto.randomUUID();
            await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    pk: `USER#${user_id}`,
                    sk: `CAT#${category_id}`,
                    id: category_id,
                    user_id,
                    name: category_name,
                    type,
                    created_at: new Date().toISOString()
                }
            }));
        }

        // Create the transaction
        const txnId = crypto.randomUUID();
        const now = new Date().toISOString();

        const item = {
            pk: `USER#${user_id}`,
            sk: `TXN#${transaction_date}#${txnId}`,
            id: txnId,
            user_id,
            category_id,
            category_name,
            amount: Number(amount),
            transaction_date,
            description: description || null,
            type,
            created_at: now
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        }));

        res.status(201).json(item);
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─── Get all transactions for the logged-in user ─────────────────
export const getTransactions = async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': `USER#${user_id}`,
                ':prefix': 'TXN#'
            },
            ScanIndexForward: false // descending order (newest first)
        }));

        res.status(200).json(result.Items || []);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─── Update a transaction ────────────────────────────────────────
export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const { category_id, amount, transaction_date, description, type } = req.body;

        // First find the transaction by scanning TXN# items
        const findResult = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'id = :id',
            ExpressionAttributeValues: {
                ':pk': `USER#${user_id}`,
                ':prefix': 'TXN#',
                ':id': id
            }
        }));

        if (!findResult.Items || findResult.Items.length === 0) {
            return res.status(404).json({ error: "Transaction not found or unauthorized" });
        }

        const existing = findResult.Items[0];
        const updates = [];
        const exprValues = {};

        if (category_id !== undefined) {
            updates.push('category_id = :cat');
            exprValues[':cat'] = category_id;
        }
        if (amount !== undefined) {
            updates.push('amount = :amt');
            exprValues[':amt'] = Number(amount);
        }
        if (description !== undefined) {
            updates.push('description = :desc');
            exprValues[':desc'] = description;
        }
        if (type !== undefined) {
            if (type !== 'income' && type !== 'expense') {
                return res.status(400).json({ error: "Type must be either 'income' or 'expense'" });
            }
            updates.push('#t = :type');
            exprValues[':type'] = type;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No fields provided to update" });
        }

        const exprNames = type !== undefined ? { '#t': 'type' } : undefined;

        const result = await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: existing.pk, sk: existing.sk },
            UpdateExpression: `SET ${updates.join(', ')}`,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ReturnValues: 'ALL_NEW'
        }));

        res.status(200).json(result.Attributes);
    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─── Delete a transaction ────────────────────────────────────────
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Find the transaction first to get its sort key
        const findResult = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'id = :id',
            ExpressionAttributeValues: {
                ':pk': `USER#${user_id}`,
                ':prefix': 'TXN#',
                ':id': id
            }
        }));

        if (!findResult.Items || findResult.Items.length === 0) {
            return res.status(404).json({ error: "Transaction not found or unauthorized" });
        }

        const txn = findResult.Items[0];

        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: txn.pk, sk: txn.sk }
        }));

        res.status(200).json({ message: "Transaction deleted successfully", id });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
