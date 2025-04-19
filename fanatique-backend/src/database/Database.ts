/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from 'mysql2/promise';

class Database {
	private static pool: mysql.Pool;
	private static connection: mysql.PoolConnection | null = null;

	constructor() {
		if (!Database.pool) {
			Database.pool = mysql.createPool({
				host: process.env.DB_HOST || 'localhost',
				user: process.env.DB_USER || 'root',
				password: process.env.DB_PASSWORD || '',
				database: process.env.DB_NAME || 'fanatique',
				waitForConnections: true,
				connectionLimit: 10,
				queueLimit: 0
			});
		}
	}

	protected async query(sql: string, params: any[] = []): Promise<any> {
		try {
			const connection = await Database.pool.getConnection();
			try {
				const [rows, fields] = await connection.query(sql, params);
				return [rows, fields];
			} finally {
				connection.release();
			}
		} catch (error) {
			console.error('Database error:', error);
			throw error;
		}
	}

	static async startTransaction(): Promise<void> {
		if (Database.connection) {
			throw new Error('Transaction already started');
		}
		
		Database.connection = await Database.pool.getConnection();
		await Database.connection.beginTransaction();
	}

	static async commit(): Promise<void> {
		if (!Database.connection) {
			throw new Error('No transaction to commit');
		}
		
		await Database.connection.commit();
		Database.connection.release();
		Database.connection = null;
	}

	static async rollback(): Promise<void> {
		if (!Database.connection) {
			throw new Error('No transaction to rollback');
		}
		
		await Database.connection.rollback();
		Database.connection.release();
		Database.connection = null;
	}
}

export default Database;