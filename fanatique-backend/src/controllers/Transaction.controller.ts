import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import TransactionService from '@/services/Transaction.service';
import Database from '@/database/Database';
import { TransactionBasicInfo, TransactionForFront } from '@/types/transaction';

class TransactionController extends Controller {
	private service: TransactionService;

	constructor() {
		super();
		this.service = new TransactionService();
	}

	async fetch(req: Request, res: Response) {
		try {
			const transactionId = Number(req.params.id);
			if (!transactionId) throw Error(getErrorMessage('missingField', 'ID da transação'));

			const transaction: TransactionForFront | null = await this.service.fetchForFront(transactionId);
			if (!transaction) throw Error(getErrorMessage('registryNotFound', 'Transação'));

			return this.sendSuccessResponse(res, { content: transaction });
		} catch (err) {
			return this.sendErrorMessage(res, err, 'Erro ao buscar transação');
		}
	}

	async fetchByUser(req: Request, res: Response) {
		try {
			const userId: number = Number(res.locals.jwt.user_id);

			const transactions: Array<TransactionBasicInfo> = await this.service.fetchByUser(userId);
			return this.sendSuccessResponse(res, { content: transactions });
		} catch (err) {
			return this.sendErrorMessage(res, err, 'Erro ao buscar transações do usuário');
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const transactions = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: transactions });
		} catch (err) {
			return this.sendErrorMessage(res, err, 'Erro ao buscar todas as transações');
		}
	}
}

export default TransactionController; 