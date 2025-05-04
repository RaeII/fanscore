import { Request, Response, } from "express";
import Controller from "./Controller";
import service from "@/services/wallet.service";

class walletController extends Controller{

	async balanceOf(req: Request, res: Response) {
		try {
			const balance = await service.balanceOf()
			
			return this.sendSuccessResponse(res, {content:{balance}});
		} catch (err) {
			this.sendErrorMessage(res, err, 'walletController');
      	}
	}

	async signature(req: Request, res: Response) {
		try {

			console.log('chegou')
			// Extrair os dados da requisição
			const { address, message, signature, name } = req.body;
			
			// Validar se todos os campos necessários foram fornecidos
			if (!address || !message || !signature) {
				return this.sendErrorMessage(res, 'Endereço, mensagem e assinatura são obrigatórios', 'walletController');
			}
			
			// Chamar o serviço para validar a assinatura
			const result = await service.signature(address, message, signature, name);

			console.log({result})
			
			// Retornar o resultado da validação
			if (result.success) {
				return this.sendSuccessResponse(res, {
					content: result
				});
			} else {
				return res.status(400).json({
					success: false,
					message: result.message,
					needsRegistration: result.needsRegistration
				});
			}

		} catch (err) {
			console.log({err})
			this.sendErrorMessage(res, err, 'walletController');
      	}
	}

	async checkWalletExists(req: Request, res: Response) {
		try {
			const { walletAddress } = req.params;
			
			if (!walletAddress) {
				return this.sendErrorMessage(res, 'Endereço da carteira é obrigatório', 'walletController');
			}
			
			const result = await service.checkUserExists(walletAddress);
			
			return res.status(200).json(result);
		} catch (err) {
			this.sendErrorMessage(res, err, 'walletController');
		}
	}
	
	async getUserWallet(req: Request, res: Response) {
		try {
			// Extrai os dados do usuário do JWT
			const { wallet, user_id } = res.locals.jwt;
			
			return this.sendSuccessResponse(res, {
				content: {
					wallet,
					user_id
				}
			});
		} catch (err) {
			this.sendErrorMessage(res, err, 'walletController');
		}
	}
}

export default new walletController();