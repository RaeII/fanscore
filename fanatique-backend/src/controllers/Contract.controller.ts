import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import ContractService from '@/services/Contract.service';
import Database from '@/database/Database';
import { TransferTokenPayload, TransferStablecoinPayload } from '@/types/transaction';

class ContractController extends Controller {
	private service: ContractService;

	constructor() {
		super();
		this.service = new ContractService();
	}

	async configureAllClubTokens(req: Request, res: Response): Promise<void> {
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

	async transferTokensToUser(req: Request, res: Response): Promise<void> {
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

	async getWalletTokens(req: Request, res: Response): Promise<void> {
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

	async getWalletTokenByClub(req: Request, res: Response): Promise<void> {
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

	/**
	 * Obtém o saldo de todas as stablecoins registradas para um endereço específico
	 * @param req Objeto Request com o endereço da carteira nos parâmetros
	 * @param res Objeto Response para retornar os saldos
	 */
	async getStablecoinBalances(req: Request, res: Response): Promise<void> {
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
			
			const balances = await this.service.getStablecoinBalances(walletAddress);
			
			return this.sendSuccessResponse(res, { 
				content: balances,
				message: getSuccessMessage('fetch', 'Saldos de stablecoins da carteira') 
			});
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	/**
	 * Obtém o saldo de uma stablecoin específica para um endereço de carteira
	 * @param req Objeto Request com o endereço da carteira e o ID da stablecoin nos parâmetros
	 * @param res Objeto Response para retornar o saldo
	 */
	async getStablecoinBalance(req: Request, res: Response): Promise<void> {
		try {
			// Se o endereço não for fornecido, usar o do usuário logado
			let walletAddress = req.params.wallet_address as string;
			const stablecoinId = Number(req.params.stablecoin_id);
			
			if (!stablecoinId) {
				throw Error(getErrorMessage('missingField', 'ID da stablecoin'));
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
			
			const balance = await this.service.getStablecoinBalance(walletAddress, stablecoinId);
			
			return this.sendSuccessResponse(res, { 
				content: balance,
				message: getSuccessMessage('fetch', 'Saldo da stablecoin') 
			});
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	/**
	 * Realiza um pagamento usando uma stablecoin específica
	 * @param req Objeto Request com os dados do pagamento
	 * @param res Objeto Response para retornar o resultado da transação
	 */
	async payWithStablecoin(req: Request, res: Response): Promise<void> {
		try {
			const { from_address, to_address, stablecoin_id, amount } = req.body;

			if (!from_address) {
				throw Error(getErrorMessage('missingField', 'Endereço de origem'));
			}

			if (!to_address) {
				throw Error(getErrorMessage('missingField', 'Endereço de destino'));
			}

			if (!stablecoin_id) {
				throw Error(getErrorMessage('missingField', 'ID da stablecoin'));
			}

			if (!amount) {
				throw Error(getErrorMessage('missingField', 'Valor a transferir'));
			}
			
			await Database.startTransaction();
			const result = await this.service.payWithStablecoin(
				from_address,
				to_address,
				parseInt(stablecoin_id),
				amount
			);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: result,
				message: getSuccessMessage('create', 'Pagamento com stablecoin realizado com sucesso') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			return await this.sendErrorMessage(res, err);
		}
	}

	/**
	 * Transfere stablecoins para um usuário
	 * @param req Objeto Request com os dados para transferência
	 * @param res Objeto Response para retornar o resultado
	 */
	async transferStablecoinsToUser(req: Request, res: Response): Promise<void> {
		try {
			const data: TransferStablecoinPayload = req.body;
			const userId: number = Number(res.locals.jwt.user_id);
			
			if (!data.stablecoin_id) throw Error(getErrorMessage('missingField', 'ID da stablecoin'));
			if (!data.to) throw Error(getErrorMessage('missingField', 'Endereço do destinatário'));
			if (!data.amount) throw Error(getErrorMessage('missingField', 'Quantidade de tokens'));
			
			await Database.startTransaction();
			const result = await this.service.transferStablecoinsToUser(data, userId);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: result, 
				message: getSuccessMessage('create', 'Stablecoins transferidas com sucesso') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default ContractController; 