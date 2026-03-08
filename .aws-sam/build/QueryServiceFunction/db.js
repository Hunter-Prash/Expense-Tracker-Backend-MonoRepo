import { Pool } from "pg";

const pool = new Pool({
    host: process.env.DB_HOST || 'aeronode-rds-server.cf28seae0k2m.ap-south-1.rds.amazonaws.com',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Admin$1234',
    database: process.env.DB_NAME || 'Expense-Tracker-DB',
    ssl: { rejectUnauthorized: false },
    max: 3
});

export const query = async (text, params = []) => {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (err) {
        console.error("❌ Database Query Failed");
        console.error("Query:", text);
        console.error("Params:", params);
        console.error("Error:", err);
        throw err;
    }
};