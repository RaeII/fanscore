import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import EstablishmentService from '@/services/Establishment.service';
import Database from '@/database/Database';
import { Establishment, EstablishmentForFront, EstablishmentInsert, EstablishmentUpdatePayload } from '@/types';

class EstablishmentController extends Controller {
	private service: EstablishmentService;

	constructor() {
		super();
		this.service = new EstablishmentService();
	}

	async create(req: Request, res: Response) {
		try {
			const body: EstablishmentInsert = {
				name: req.body.name,
				segment: req.body.segment,
				image: req.body.image
			};

			// Validar os campos obrigatórios
			if (!body.name) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Nome do estabelecimento')));
			}

			if (!body.segment) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Segmento do estabelecimento')));
			}

			if (!body.image) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Imagem do estabelecimento')));
			}

			await Database.startTransaction();
			const establishmentId = await this.service.create(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: { id: establishmentId }, 
				message: getSuccessMessage('create', 'Estabelecimento') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			console.log(err);
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const establishmentId: number = Number(req.params.id);

			const establishment: EstablishmentForFront | null = await this.service.fetchForFront(establishmentId);
			if (!establishment) throw Error(getErrorMessage('registryNotFound', 'Estabelecimento'));

			return this.sendSuccessResponse(res, { content: establishment });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const establishments = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: establishments });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: EstablishmentUpdatePayload = {
				name: req.body.name,
				segment: req.body.segment,
				image: req.body.image
			};
			const establishmentId: number = Number(req.params.id);

			const establishment: Establishment | null = await this.service.fetch(establishmentId);

			if (!establishment) throw Error(getErrorMessage('registryNotFound', 'Estabelecimento'));

			await this.service.update(body, establishmentId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Estabelecimento') });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const establishmentId: number = Number(req.params.id);
			
			const establishment: Establishment | null = await this.service.fetch(establishmentId);
			if (!establishment) throw Error(getErrorMessage('registryNotFound', 'Estabelecimento'));
			
			Database.startTransaction();
			await this.service.remove(establishmentId);
			Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'Estabelecimento') });
		} catch (err) {
			Database.rollback();
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default EstablishmentController; 