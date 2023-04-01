import { validate as validateEmailAddress } from 'email-validator';
import { Pool } from 'pg';
import Database from "./index";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export class PostgresAdapter extends Database {
    public async initialize() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS authentication (
                id TEXT PRIMARY KEY,
                email TEXT,
                password_hash BYTEA,
                salt BYTEA
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                chat_id TEXT,
                data TEXT
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS shares (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                created_at TIMESTAMP
            );
        `);
    }

    public async createUser(email: string, passwordHash: Buffer, salt: Buffer): Promise<void> {
        if (!validateEmailAddress(email)) {
            throw new Error('invalid email address');
        }

        try {
            await pool.query(`INSERT INTO authentication (id, email, password_hash, salt) VALUES ($1, $2, $3, $4)`, [email, email, passwordHash, salt]);
            console.log(`[database:postgres] created user ${email}`);
        } catch (err) {
            console.log(`[database:postgres] failed to create user ${email}`);
            throw err;
        }
    }

    public async getUser(email: string): Promise<any> {
        try {
            const result = await pool.query(`SELECT * FROM authentication WHERE email = $1`, [email]);
            if (result.rowCount === 0) {
                console.log(`[database:postgres] user ${email} not found`);
                throw new Error('user not found');
            }

            const row = result.rows[0];
            console.log(`[database:postgres] retrieved user ${email}`);
            return {
                ...row,
                passwordHash: Buffer.from(row.password_hash),
                salt: Buffer.from(row.salt),
            };
        } catch (err) {
            console.log(`[database:postgres] failed to get user ${email}`);
            throw err;
        }
    }

    public async getChats(userID: string): Promise<any[]> {
        try {
            const result = await pool.query(`SELECT * FROM chats WHERE user_id = $1`, [userID]);
            console.log(`[database:postgres] retrieved ${result.rowCount} chats for user ${userID}`);
            return result.rows;
        } catch (err) {
            console.log(`[database:postgres] failed to get chats for user ${userID}`);
            throw err;
        }
    }

    public async getMessages(userID: string): Promise<any[]> {
        try {
            const result = await pool.query(`SELECT * FROM messages WHERE user_id = $1`, [userID]);
            console.log(`[database:postgres] retrieved ${result.rowCount} messages for user ${userID}`);
            return result.rows.map(row => {
                row.data = JSON.parse(row.data);
                return row;
            });
        } catch (err) {
            console.log(`[database:postgres] failed to get messages for user ${userID}`);
            throw err;
        }
    }

    public async insertMessages(userID: string, messages: any[]): Promise<void> {
        try {
            const queryText = `INSERT INTO messages (id, user_id, chat_id, data) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`;
            const queries = messages.map(message => {
                return pool.query(queryText, [message.id, userID, message.chatID, JSON.stringify(message)]);
            });
            await Promise.all(queries);
            console.log(`[database:postgres] inserted ${messages.length} messages`);
        } catch (err) {
            throw err;
        }
    }

    public async createShare(userID: string | null, id: string): Promise<boolean> {
        try {
            await pool.query(`INSERT INTO shares (id, user_id, created_at) VALUES ($1, $2, $3)`, [id, userID, new Date()]);
            console.log(`[database:postgres] created share ${id}`);
            return true;
        } catch (err) {
            console.log(`[database:postgres] failed to create share ${id}`);
            throw err;
        }
    }

    public async setTitle(userID: string, chatID: string, title: string): Promise<void> {
        try {
            await pool.query(`INSERT INTO chats (id, user_id, title) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`, [chatID, userID, title]);
            console.log(`[database:postgres] set title for chat ${chatID}`);
        } catch (err) {
            console.log(`[database:postgres] failed to set title for chat ${chatID}`);
            throw err;
        }
    }
}
