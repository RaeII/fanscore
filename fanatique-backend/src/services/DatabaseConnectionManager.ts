import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { AsyncLocalStorage } from 'async_hooks';
interface ConnectionContext {
	connection: PoolConnection | null;
	isInTransaction: boolean;
}

export default class DatabaseConnectionManager {
	private static pool: Pool;
	private static asyncLocalStorage = new AsyncLocalStorage<ConnectionContext>();
  
	static initialize() {
	  this.pool = mysql.createPool({
			host: process.env.DB_HOSTNAME || "",
			user: process.env.DB_USERNAME || "",
			password: process.env.DB_PASSWORD || "",
			port: parseInt(process.env.DB_PORT || "3306"),
			waitForConnections: true,
			connectionLimit: 10,
			connectTimeout: 15000,
			queueLimit: 0,
			enableKeepAlive: true,
			timezone: '+00:00'
		});
	}
  
	static async getConnection(): Promise<PoolConnection> {
		const context = this.asyncLocalStorage.getStore();
		if (!context) {
		  	throw new Error('No connection context available. Ensure the middleware is properly set up.');
		}

		if (!context.connection) {
		  	context.connection = await this.pool.getConnection();
		}
		return context.connection;
	}

	static isInTransaction(): boolean {
		const context = this.asyncLocalStorage.getStore();
		return context ? context.isInTransaction : false;
	}
  
	static async beginTransaction(): Promise<void> {
		let context = this.asyncLocalStorage.getStore();

		if(!context?.connection) {
			await this.getConnection();
			context = this.asyncLocalStorage.getStore();
			
		}
		if (!context) {
			throw new Error('No connection context available');
		}

		if (context.connection && !context.isInTransaction) {
			await context.connection.beginTransaction();
			context.isInTransaction = true;
		}
	}

	static async commit(): Promise<void> {
		const context = this.asyncLocalStorage.getStore();

		if (context && context.connection && context.isInTransaction) {
			await context.connection.commit();
			context.isInTransaction = false;
			await this.release();
		}else {
			throw new Error('No active transaction');
		}
	}
	
	static async rollback(): Promise<void> {
		const context = this.asyncLocalStorage.getStore();
		if (context && context.connection && context.isInTransaction) {
			await context.connection.rollback();
			context.isInTransaction = false;
			await this.release();
		} else {
			throw new Error('No active transaction');
		}
	}

	static async release() {
		const context = this.asyncLocalStorage.getStore();
		if (context && context.connection) {
			context.connection.release();
			context.connection = null;
			context.isInTransaction = false;
		}
	  }


	static async runWithConnection<T>(callback: () => Promise<T>): Promise<T> {
		const connection = await this.pool.getConnection();
		try {
		  	return await this.asyncLocalStorage.run({ connection, isInTransaction: false }, callback);
		} finally {
		  	connection.release();
		}
	}
}