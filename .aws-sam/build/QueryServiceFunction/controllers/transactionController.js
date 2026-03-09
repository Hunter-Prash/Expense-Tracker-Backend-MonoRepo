import { query } from "../db.js";


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

        // 1. Find or Create the Category
        let category_id;
        
        // Try to find the category first (case-insensitive search)
        const findCategoryQuery = `SELECT id FROM categories WHERE user_id = ${user_id} AND LOWER(name) = LOWER('${category_name}') AND type = '${type}' LIMIT 1;`;
        const categoryResult = await query(findCategoryQuery);

        if (categoryResult.rows.length > 0) {
            category_id = categoryResult.rows[0].id;
        } else {
            // Category doesn't exist, create it
            const createCategoryQuery = `INSERT INTO categories (user_id, name, type) VALUES (${user_id}, '${category_name}', '${type}') RETURNING id;`;
            const newCategoryResult = await query(createCategoryQuery);
            category_id = newCategoryResult.rows[0].id;
        }

        // 2. Insert the Transaction
        const descValue = description ? `'${description}'` : 'NULL';
        const insertQuery = `
            INSERT INTO transactions (user_id, category_id, amount, transaction_date, description, type)
            VALUES (${user_id}, ${category_id}, ${amount}, '${transaction_date}', ${descValue}, '${type}')
            RETURNING *;
        `;
        
        const result = await query(insertQuery);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// @desc    Get all transactions for the logged in user
// @route   GET /api/v1/transactions
// @access  Private
export const getTransactions = async (req, res) => {
    try {
        const user_id = req.user.id;

        const getQuery = `
            SELECT t.*, c.name as category_name 
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ${user_id}
            ORDER BY t.transaction_date DESC, t.created_at DESC;
        `;

        const result = await query(getQuery);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// @desc    Update a transaction
// @route   PUT /api/v1/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const { category_id, amount, transaction_date, description, type } = req.body;

        // Verify ownership
        const checkQuery = `SELECT id FROM transactions WHERE id = ${id} AND user_id = ${user_id};`;
        const checkResult = await query(checkQuery);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: "Transaction not found or unauthorized" });
        }

        // Build dynamic update query
        const updates = [];

        if (category_id !== undefined) {
            updates.push(`category_id = ${category_id}`);
        }
        if (amount !== undefined) {
            updates.push(`amount = ${amount}`);
        }
        if (transaction_date !== undefined) {
            updates.push(`transaction_date = '${transaction_date}'`);
        }
        if (description !== undefined) {
            updates.push(`description = '${description}'`);
        }
        if (type !== undefined) {
            if (type !== 'income' && type !== 'expense') {
                return res.status(400).json({ error: "Type must be either 'income' or 'expense'" });
            }
            updates.push(`type = '${type}'`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No fields provided to update" });
        }

        const updateQuery = `
            UPDATE transactions 
            SET ${updates.join(', ')}
            WHERE id = ${id} AND user_id = ${user_id}
            RETURNING *;
        `;

        const result = await query(updateQuery);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// @desc    Delete a transaction
// @route   DELETE /api/v1/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const deleteQuery = `
            DELETE FROM transactions 
            WHERE id = ${id} AND user_id = ${user_id}
            RETURNING id;
        `;

        const result = await query(deleteQuery);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Transaction not found or unauthorized" });
        }

        res.status(200).json({ message: "Transaction deleted successfully", id: result.rows[0].id });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
