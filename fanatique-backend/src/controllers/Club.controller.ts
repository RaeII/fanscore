import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import ClubService from '@/services/Club.service';
import Database from '@/database/Database';
import { Club, ClubForFront, ClubInsert, ClubUpdatePayload } from '@/types';

class ClubController extends Controller {
	private service: ClubService;

	constructor() {
		super();
		this.service = new ClubService();
	}

	async create(req: Request, res: Response) {
		try {
			const body: ClubInsert = {
				name: req.body.name,
				image: req.body.image,
				symbol: req.body.symbol
			};

			// Validar se existe a imagem
			if (!body.name) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Nome do clube')));
			}

			if (!body.image) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Imagem do clube')));
			}

			if (!body.symbol) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Símbolo do clube')));
			}

			await Database.startTransaction();
			const clubId = await this.service.create(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { content: { id: clubId }, message: getSuccessMessage('create', 'Clube') });
		} catch (err) {
			await Database.rollback().catch(console.log);
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const clubId: number = Number(req.params.id);

			const club: ClubForFront | null = await this.service.fetchForFront(clubId);
			if (!club) throw Error(getErrorMessage('registryNotFound', 'Clube'));

			return this.sendSuccessResponse(res, { content: club });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const clubs = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: clubs });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: ClubUpdatePayload = {
				name: req.body.name,
				image: req.body.image
			};
			const clubId: number = Number(req.params.id);

			const club: Club | null = await this.service.fetch(clubId);

			if (!club) throw Error(getErrorMessage('registryNotFound', 'Clube'));

			await this.service.update(body, clubId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Clube') });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const clubId: number = Number(req.params.id);
			
			const club: Club | null = await this.service.fetch(clubId);
			if (!club) throw Error(getErrorMessage('registryNotFound', 'Clube'));
			
			Database.startTransaction();
			await this.service.remove(clubId);
			Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'Clube') });
		} catch (err) {
			Database.rollback();
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default ClubController; 