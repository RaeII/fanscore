import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import EstablishmentStadiumService from '@/services/EstablishmentStadium.service';
import Database from '@/database/Database';
import { EstablishmentStadium, EstablishmentStadiumBasicInfo, EstablishmentStadiumInsert, EstablishmentStadiumUpdate } from '@/types';

class EstablishmentStadiumController extends Controller {
	private service: EstablishmentStadiumService;

	constructor() {
		super();
		this.service = new EstablishmentStadiumService();
	}

	async create(req: Request, res: Response) {
		try {
			const body: EstablishmentStadiumInsert = {
				establishment_id: Number(req.body.establishment_id),
				stadium_id: Number(req.body.stadium_id)
			};

			// Validar os campos obrigatórios
			if (!body.establishment_id) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'ID do estabelecimento')));
			}

			if (!body.stadium_id) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'ID do estádio')));
			}

			await Database.startTransaction();
			const linkId = await this.service.create(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: { id: linkId }, 
				message: getSuccessMessage('create', 'Vínculo entre estabelecimento e estádio') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			console.log(err);
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const linkId: number = Number(req.params.id);

			const link: EstablishmentStadium | null = await this.service.fetch(linkId);
			if (!link) throw Error(getErrorMessage('registryNotFound', 'Vínculo'));

			return this.sendSuccessResponse(res, { content: link });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const links: EstablishmentStadiumBasicInfo[] = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: links });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByStadium(req: Request, res: Response) {
		try {
			const stadiumId: number = Number(req.params.stadium_id);
			
			if (!stadiumId) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'ID do estádio')));
			}
			
			const links: EstablishmentStadiumBasicInfo[] = await this.service.fetchByStadiumId(stadiumId);
			return this.sendSuccessResponse(res, { content: links });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByEstablishment(req: Request, res: Response) {
		try {
			const establishmentId: number = Number(req.params.establishment_id);
			
			if (!establishmentId) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'ID do estabelecimento')));
			}
			
			const links: EstablishmentStadiumBasicInfo[] = await this.service.fetchByEstablishmentId(establishmentId);
			return this.sendSuccessResponse(res, { content: links });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: EstablishmentStadiumUpdate = {
				establishment_id: req.body.establishment_id ? Number(req.body.establishment_id) : undefined,
				stadium_id: req.body.stadium_id ? Number(req.body.stadium_id) : undefined
			};
			const linkId: number = Number(req.params.id);

			const link: EstablishmentStadium | null = await this.service.fetch(linkId);

			if (!link) throw Error(getErrorMessage('registryNotFound', 'Vínculo'));

			await this.service.update(body, linkId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Vínculo') });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const linkId: number = Number(req.params.id);
			
			const link: EstablishmentStadium | null = await this.service.fetch(linkId);
			if (!link) throw Error(getErrorMessage('registryNotFound', 'Vínculo'));
			
			Database.startTransaction();
			await this.service.remove(linkId);
			Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'Vínculo') });
		} catch (err) {
			Database.rollback();
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default EstablishmentStadiumController; 