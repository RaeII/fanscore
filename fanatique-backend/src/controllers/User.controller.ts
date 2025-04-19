import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import UserService from '@/services/User.service';
import Database from '@/database/Database';
import AuthController from './AuthController';
import { UserAccount, UserAccountForFront, UserAccountInsertPayload, UserAccountUpdatePayload } from '../types';

class UserController extends Controller {
	private service: UserService;

	constructor() {
		super();
		this.service = new UserService();
	}

	async create(req: Request, res: Response) {
		const authController = new AuthController();

		try {
			const body: UserAccountInsertPayload = req.body;

			if (!body.wallet_address) throw Error(getErrorMessage('missingField', 'Endereço da carteira'));
			if (!body.name) throw Error(getErrorMessage('missingField', 'Nome de usuário'));
			
			const userByWallet = await this.service.fetchByEmail(body.wallet_address);
			if (userByWallet !== null) throw Error(getErrorMessage('emailAlreadyExist'));
			
			const userByUsername = await this.service.fetchByUsername(body.name);
			if (userByUsername !== null) throw Error(getErrorMessage('userAlreadyExist'));

			await Database.startTransaction();
			const userId = await this.service.create(body);
			req.body.user_id = userId;

			const jwt = await authController.createJWT(req, res);

			await Database.commit();
			
			return jwt;
		} catch (err) {
			await Database.rollback().catch(console.log);
			return this.sendErrorMessage(res, err, 'Erro ao criar usuário');
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const userId: number = Number(res.locals.jwt.user_id);

			const user: UserAccountForFront | null = await this.service.fetchForFront(userId);
			if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuário'));

			return this.sendSuccessResponse(res, { content: { ...user } });
		} catch (err) {
			this.sendErrorMessage(res, err, 'Erro ao buscar usuário');
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const users = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: users });
		} catch (err) {
			this.sendErrorMessage(res, err, 'Erro ao buscar todos usuários');
		}
	}

	async fetchIsWalletAddressUnique(req: Request, res: Response) {
		try {
			const isUnique = (await this.service.fetchByEmail(req.params.wallet_address)) === null;

			return this.sendSuccessResponse(res, { content: { is_unique: isUnique } });
		} catch (err) {
			this.sendErrorMessage(res, err, 'Erro ao verificar unicidade da carteira');
		}
	}

	async fetchIsUsernameUnique(req: Request, res: Response) {
		try {
			const isUnique = await this.service.fetchIsUsernameUnique(req.params.username);

			return this.sendSuccessResponse(res, { content: { is_unique: isUnique } });
		} catch (err) {
			return this.sendErrorMessage(res, err, 'Erro ao verificar unicidade do nome de usuário');
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: UserAccountUpdatePayload = req.body;
			const userId: number = Number(res.locals.jwt.user_id);

			const user: UserAccount | null = await this.service.fetch(userId);

			if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuario'));

			await this.service.update(body, userId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Usuario') });
		} catch (err) {
			return this.sendErrorMessage(res, err, 'Erro ao atualizar usuário');
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const userId: number = Number(res.locals.jwt.user_id);
			Database.startTransaction();
			await this.service.remove(userId);
			Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'Usuario') });
		} catch (err) {
			Database.rollback();
			return this.sendErrorMessage(res, err, 'Erro ao excluir usuário');
		}
	}
}

export default UserController;
