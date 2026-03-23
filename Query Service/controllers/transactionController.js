import crypto from 'crypto';
import { docClient, TRANSACTIONS_TABLE, CATEGORIES_TABLE, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '../db.js';
import { toISTISOString } from '../utils/time.js';
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const eventBridgeClient = new EventBridgeClient({
    region: 'ap-south-1'
});

const EVENT_BUS_NAME = 'expense-alert-bus';

const publishTransactionEvent = async (detailType, detail) => {
    try {
        const response = await eventBridgeClient.send(new PutEventsCommand({
            Entries: [{
                Source: 'expense-tracker.transactions',
                DetailType: detailType,
                EventBusName: EVENT_BUS_NAME,
                Detail: JSON.stringify(detail),//actual paylaod
                Time: new Date()
            }]
        }));

        if (response.FailedEntryCount && response.FailedEntryCount > 0) {
            console.error(`EventBridge publish failed for ${detailType}`, response.Entries);
        }
    } catch (eventError) {
        // Best effort: transaction persistence succeeded, so we only log publish failures.
        console.error(`EventBridge error for ${detailType}:`, eventError);
    }
};


const formatShiftedIST = (dateObj) => {
        const pad = (value, length = 2) => String(value).padStart(length, '0');
        return `${dateObj.getUTCFullYear()}-${pad(dateObj.getUTCMonth() + 1)}-${pad(dateObj.getUTCDate())}T${pad(dateObj.getUTCHours())}:${pad(dateObj.getUTCMinutes())}:${pad(dateObj.getUTCSeconds())}.${pad(dateObj.getUTCMilliseconds(), 3)}+05:30`;
    };

const getCurrentISTRanges = () => {
    const now = new Date();
    const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

    const dayStart = new Date(istNow);
    dayStart.setUTCHours(0, 0, 0, 0);

    const daysSinceMonday = (istNow.getUTCDay() + 6) % 7;
    const weekStart = new Date(istNow);
    weekStart.setUTCDate(istNow.getUTCDate() - daysSinceMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    const monthStart = new Date(istNow);
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    return {
        currentDayStart: formatShiftedIST(dayStart),
        currentWeekStart: formatShiftedIST(weekStart),
        currentMonthStart: formatShiftedIST(monthStart),
        currentNow: formatShiftedIST(istNow)
    };
};








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
            category_name: category_name.toLowerCase(),
            amount: Number(amount),
            transaction_date,
            description: description || null,
            type,
            created_at: now
        };
        //put in db table
        await docClient.send(new PutCommand({
            TableName: TRANSACTIONS_TABLE,
            Item: item
        }));

        await publishTransactionEvent('TransactionCreated', {
            transaction: item,
            occurred_at: toISTISOString()
        });

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





//------get tranactions according to current month --------
export const getTransactionsByMonth = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { currentMonthStart, currentNow } = getCurrentISTRanges();

        const command = new QueryCommand({
            TableName: TRANSACTIONS_TABLE,
            KeyConditionExpression: 'user_id = :user_id AND transaction_date BETWEEN :currentMonthStart AND :currentMonthNow',
            FilterExpression: '#t = :type',
            ExpressionAttributeNames: { '#t': 'type' },
            ExpressionAttributeValues: {
                ':user_id': user_id,
                ':currentMonthStart': currentMonthStart,
                ':currentMonthNow': currentNow,
                ':type': 'expense'
            }
        });

        const response = await docClient.send(command);
        const transactions = response.Items || [];

        const categoryTotalsMap = {};
        

        for (const txn of transactions) {
            const category = txn.category_name || 'uncategorized';
            const amount = Number(txn.amount || 0);
            categoryTotalsMap[category] = (categoryTotalsMap[category] || 0) + amount;
        }

        const categoryTotals = Object.entries(categoryTotalsMap).map(([category_name, total_amount]) => ({
            category_name,
            total_amount
        }));

        return res.status(200).json({
            user_id,
            month_start: currentMonthStart,
            month_now: currentNow,
            category_totals: categoryTotals,
        });
    } catch (e) {
        console.error("Error fetching monthly transactions:", e);
        return res.status(500).json({ error: "Internal server error" });
    }
}






//------get spent so far (day/week/month) --------
export const getSpendSummary = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { currentDayStart, currentWeekStart, currentMonthStart, currentNow } = getCurrentISTRanges();

        const [dayResult, weekResult, monthResult] = await Promise.all([
            docClient.send(new QueryCommand({
                TableName: TRANSACTIONS_TABLE,
                KeyConditionExpression: 'user_id = :user_id AND transaction_date BETWEEN :start AND :end',
                FilterExpression: '#t = :type',
                ExpressionAttributeNames: { '#t': 'type' },
                ExpressionAttributeValues: {
                    ':user_id': user_id,
                    ':start': currentDayStart,
                    ':end': currentNow,
                    ':type': 'expense'
                }
            })),
            docClient.send(new QueryCommand({
                TableName: TRANSACTIONS_TABLE,
                KeyConditionExpression: 'user_id = :user_id AND transaction_date BETWEEN :start AND :end',
                FilterExpression: '#t = :type',
                ExpressionAttributeNames: { '#t': 'type' },
                ExpressionAttributeValues: {
                    ':user_id': user_id,
                    ':start': currentWeekStart,
                    ':end': currentNow,
                    ':type': 'expense'
                }
            })),
            docClient.send(new QueryCommand({
                TableName: TRANSACTIONS_TABLE,
                KeyConditionExpression: 'user_id = :user_id AND transaction_date BETWEEN :start AND :end',
                FilterExpression: '#t = :type',
                ExpressionAttributeNames: { '#t': 'type' },
                ExpressionAttributeValues: {
                    ':user_id': user_id,
                    ':start': currentMonthStart,
                    ':end': currentNow,
                    ':type': 'expense'
                }
            }))
        ]);

        const daily_spent = (dayResult.Items || []).reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
        const weekly_spent = (weekResult.Items || []).reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
        const monthly_spent = (monthResult.Items || []).reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

        return res.status(200).json({
            user_id,
            daily_spent,
            weekly_spent,
            monthly_spent,
            current_day_start: currentDayStart,
            current_week_start: currentWeekStart,
            current_month_start: currentMonthStart,
            current_now: currentNow
        });
    } catch (error) {
        console.error("Error fetching spend summary:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}




// ─── Update a transaction ────────────────────────────────────────
export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const { category_id, amount, description, type } = req.body;

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

        await publishTransactionEvent('TransactionUpdated', {
            transaction: result.Attributes,
            occurred_at: toISTISOString()
        });

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

        await publishTransactionEvent('TransactionDeleted', {
            transaction: txn,
            occurred_at: toISTISOString()
        });

        res.status(200).json({ message: "Transaction deleted successfully", id });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
