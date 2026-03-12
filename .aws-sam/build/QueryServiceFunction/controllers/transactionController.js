import crypto from 'crypto';
import { docClient, TRANSACTIONS_TABLE, CATEGORIES_TABLE, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '../db.js';
import { toISTISOString } from '../utils/time.js';

// ─── Create a transaction ─────────────────────────────────────────
export const createTransaction = async (req, res) => {
    try {
        let { amount, description, type, category_name } = req.body;
        const user_id = req.user.id;

        // Use full ISO string to ensure uniqueness as Sort Key
        const transaction_date = toISTISOString(); 

        if (!amount || !type || !category_name) {
            return res.status(400).json({ error: "Amount, type, and category_name are required" });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: "Type must be either 'income' or 'expense'" });
        }

        // Find or create the category in Categories table
        // We query the Categories table to see if a category with this name and type exists for this user
        // Note: For a robust system, an index on 'name' might be useful, but for this scale, scanning the user's categories is fast enough
        const catResult = await docClient.send(new QueryCommand({
            TableName: CATEGORIES_TABLE,
            KeyConditionExpression: 'user_id = :userId',
            FilterExpression: '#n = :name AND #t = :type',
            ExpressionAttributeNames: { '#n': 'name', '#t': 'type' },
            ExpressionAttributeValues: {
                ':userId': user_id,
                ':name': category_name.toLowerCase(),
                ':type': type
            }
        }));

        let category_id;
        if (catResult.Items && catResult.Items.length > 0) {
            category_id = catResult.Items[0].id;
        } else {
            category_id = crypto.randomUUID();
            await docClient.send(new PutCommand({
                TableName: CATEGORIES_TABLE,
                Item: {
                    user_id,
                    id: category_id,
                    name: category_name.toLowerCase(),
                    type,
                    created_at: toISTISOString()
                }
            }));
        }

        // Create the transaction in Transactions table
        const txnId = crypto.randomUUID();
        const now = toISTISOString();

        const item = {
            user_id,
            id: txnId,
            category_id,
            category_name:category_name.toLowerCase(),
            amount: Number(amount),
            transaction_date,
            description: description || null,
            type,
            created_at: now
        };

        await docClient.send(new PutCommand({
            TableName: TRANSACTIONS_TABLE,
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

        // Note: Transactions table has Partition Key = user_id, Sort Key = transaction_date
        const result = await docClient.send(new QueryCommand({
            TableName: TRANSACTIONS_TABLE,
            KeyConditionExpression: 'user_id = :userId',
            ExpressionAttributeValues: {
                ':userId': user_id
            },
            ScanIndexForward: false // descending order (newest date first)
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

        // To update, we need both Partition Key (user_id) and Sort Key (transaction_date)
        // Since we only have 'id', we query the IdIndex (which only has 'id' as a key)
        const findResult = await docClient.send(new QueryCommand({
            TableName: TRANSACTIONS_TABLE,
            IndexName: 'IdIndex',
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
                ':id': id
            }
        }));

        if (!findResult.Items || findResult.Items.length === 0 || findResult.Items[0].user_id !== user_id) {
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
            return res.status(400).json({ error: "No fields provided to update (note: transaction_date cannot be updated once created due to being a sort key)" });
        }

        const exprNames = type !== undefined ? { '#t': 'type' } : undefined;

        const result = await docClient.send(new UpdateCommand({
            TableName: TRANSACTIONS_TABLE,
            Key: { user_id, transaction_date: existing.transaction_date },
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

        // Find the transaction first to get its transaction_date (Sort Key)
        // IdIndex only has 'id' as the key schema, so we query just 'id' and check user_id manually
        const findResult = await docClient.send(new QueryCommand({
            TableName: TRANSACTIONS_TABLE,
            IndexName: 'IdIndex',
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
                ':id': id
            }
        }));

        if (!findResult.Items || findResult.Items.length === 0 || findResult.Items[0].user_id !== user_id) {
            return res.status(404).json({ error: "Transaction not found or unauthorized" });
        }

        const txn = findResult.Items[0];

        await docClient.send(new DeleteCommand({
            TableName: TRANSACTIONS_TABLE,
            Key: { user_id, transaction_date: txn.transaction_date }
        }));

        res.status(200).json({ message: "Transaction deleted successfully", id });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
