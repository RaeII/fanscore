import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import ContractService from '@/services/Contract.service';
import Database from '@/database/Database';

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
}

export default ConfigController; 