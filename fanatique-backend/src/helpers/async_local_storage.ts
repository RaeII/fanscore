import { AsyncLocalStorage } from 'async_hooks';
import { NextFunction } from 'express';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Connection } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import MysqlService from '@/services/MySQL.service';

export interface ConnectionContext<T extends Request | Connection | PoolConnection> {
	base_connection: T | null;
	connection: T | null;
	is_in_transaction: boolean;
	is_prepared: boolean
}

const asyncLocalStorage = new AsyncLocalStorage<Map<string, ConnectionContext<any>>>();

const getStore = <T extends Request | Connection | PoolConnection>(key: string): ConnectionContext<T> => {
	const contexts = asyncLocalStorage.getStore();

	if (!contexts) {
		throw new Error('AsyncLocalStorage not initialized');
	}

	const context = contexts.get(key)
	
	if (!context) {
		throw new Error('Contexto da base de dado não inicializado.');
	}

	return context;
}

const getConnectionsObject = () => {
	const connetcions = new Map();

	connetcions.set('mysql', { base_connection: null, connection: null, is_in_transaction: false, is_prepared: false });
	return connetcions;
}

const connectionMiddleware = () => {
	return (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
		const connetcions = getConnectionsObject()

		asyncLocalStorage.run(connetcions, () => {
			// Garantir que todas as conexões sejam liberadas quando a resposta terminar
			res.on('finish', async () => {
				await MysqlService.release();
			});

			next();
		});
	};
}

const runWithConnection = async <T>(callback: () => Promise<T>): Promise<T> => {
	const connections = getConnectionsObject();
	const __callback = async () => {
		try {
			return await callback();
		} catch (error) {
			console.error('Error in runWithConnection:', error);
			throw error;
		} finally {
			for (const [key, con] of connections.entries()) {
				try {
					// console.log('key', key, con)
					if (key === 'mysql' || key === 'mysql2') {
						await MysqlService.release(con);
					}
				} catch (error) {
					console.error(`Error closing connection ${key}:`, error);
					// Continue to next connection even if this one fails
				}
			}
			connections.clear();
		}
	}
	return await asyncLocalStorage.run(connections, __callback);
}

export {
	getStore,
	connectionMiddleware,
	getConnectionsObject,
	runWithConnection
}