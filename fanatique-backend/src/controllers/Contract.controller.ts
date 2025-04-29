import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import ContractService from '@/services/Contract.service';
import Database from '@/database/Database';
import { TransferTokenPayload } from '@/types/transaction';

class ConfigController extends Controller {
	private service: ContractService;

	constructor() {
		super();
		this.service = new ContractService();
	}

	async configureAllClubTokens(req: Request, res: Response) {
		try {
			const { initialSupply } = req.body;
			
			await Database.startTransaction();
			const results = await this.service.configureAllClubTokens(initialSupply);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: results, 
				message: getSuccessMessage('create', 'Tokens configurados para todos os clubes') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			return await this.sendErrorMessage(res, err);
		}
	}

	async transferTokensToUser(req: Request, res: Response) {
		try {
			const data: TransferTokenPayload = req.body;
			const userId: number = Number(res.locals.jwt.user_id);
			
			if (!data.club_id) throw Error(getErrorMessage('missingField', 'ID do clube'));
			if (!data.to) throw Error(getErrorMessage('missingField', 'Endereço do destinatário'));
			if (!data.amount) throw Error(getErrorMessage('missingField', 'Quantidade de tokens'));
			
			await Database.startTransaction();
			const result = await this.service.transferTokensToUser(data, userId);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: result, 
				message: getSuccessMessage('create', 'Tokens transferidos com sucesso') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			return await this.sendErrorMessage(res, err);
		}
	}

	async getWalletTokens(req: Request, res: Response) {
		try {
			// Se o endereço não for fornecido, usar o do usuário logado
			let walletAddress = req.params.wallet_address as string;
			
			if (!walletAddress) {
				// Obter o endereço da carteira do usuário logado
				const userId = Number(res.locals.jwt.user_id);
				const userService = this.service['userService']; // Acesso ao userService
				const user = await userService.fetch(userId);
				
				if (!user) {
					throw Error(getErrorMessage('registryNotFound', 'Usuário'));
				}
				walletAddress = user.wallet_address;
			}
			
			const tokens = await this.service.getWalletTokens(walletAddress);
			
			return this.sendSuccessResponse(res, { 
				content: tokens,
				message: getSuccessMessage('fetch', 'FanTokens da carteira') 
			});
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async getWalletTokenByClub(req: Request, res: Response) {
		try {
			// Obter o endereço da carteira do parâmetro ou do usuário logado
			let walletAddress = req.params.wallet_address as string;
			const clubId = Number(req.params.club_id);
			
			if (!clubId) {
				throw Error(getErrorMessage('missingField', 'ID do clube'));
			}
			
			if (!walletAddress) {
				// Obter o endereço da carteira do usuário logado
				const userId = Number(res.locals.jwt.user_id);
				const userService = this.service['userService']; // Acesso ao userService
				const user = await userService.fetch(userId);
				
				if (!user) {
					throw Error(getErrorMessage('registryNotFound', 'Usuário'));
				}
				walletAddress = user.wallet_address;
			}
			
			const tokenInfo = await this.service.getWalletTokenByClub(walletAddress, clubId);
			
			return this.sendSuccessResponse(res, { 
				content: tokenInfo,
				message: getSuccessMessage('fetch', 'Saldo de FanToken do clube') 
			});
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default ConfigController; 