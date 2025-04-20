import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import StadiumService from '@/services/Stadium.service';
import Database from '@/database/Database';
import { Stadium, StadiumForFront, StadiumInsert, StadiumUpdatePayload } from '@/types';

class StadiumController extends Controller {
	private service: StadiumService;

	constructor() {
		super();
		this.service = new StadiumService();
	}

	async create(req: Request, res: Response) {
		try {
			console.log(req.body);
			const body: StadiumInsert = {
				name: req.body.name,
				image: req.body.image,
				city: req.body.city,
				state: req.body.state,
				club_id: Number(req.body.club_id)
			};

			// Validar os campos obrigatórios
			if (!body.name) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Nome do estádio')));
			}

			if (!body.image) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Imagem do estádio')));
			}
			
			if (!body.city) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Cidade do estádio')));
			}
			
			if (!body.state) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Estado do estádio')));
			}
			
			if (!body.club_id) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Clube do estádio')));
			}

			await Database.startTransaction();
			const stadiumId = await this.service.create(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { content: { id: stadiumId }, message: getSuccessMessage('create', 'Estádio') });
		} catch (err) {
			await Database.rollback().catch(console.log);
			console.log(err);
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const stadiumId: number = Number(req.params.id);

			const stadium: StadiumForFront | null = await this.service.fetchForFront(stadiumId);
			if (!stadium) throw Error(getErrorMessage('registryNotFound', 'Estádio'));

			return this.sendSuccessResponse(res, { content: stadium });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const stadiums = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: stadiums });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}
	
	async fetchByClubId(req: Request, res: Response) {
		try {
			const clubId: number = Number(req.params.clubId);

			const stadium: Stadium | null = await this.service.fetchByClubId(clubId);
			if (!stadium) throw Error(getErrorMessage('registryNotFound', 'Estádio para este clube'));

			return this.sendSuccessResponse(res, { content: stadium });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: StadiumUpdatePayload = {
				name: req.body.name,
				image: req.body.image,
				city: req.body.city,
				state: req.body.state
			};
			const stadiumId: number = Number(req.params.id);

			const stadium: Stadium | null = await this.service.fetch(stadiumId);

			if (!stadium) throw Error(getErrorMessage('registryNotFound', 'Estádio'));

			await this.service.update(body, stadiumId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Estádio') });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const stadiumId: number = Number(req.params.id);
			
			const stadium: Stadium | null = await this.service.fetch(stadiumId);
			if (!stadium) throw Error(getErrorMessage('registryNotFound', 'Estádio'));
			
			Database.startTransaction();
			await this.service.remove(stadiumId);
			Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'Estádio') });
		} catch (err) {
			Database.rollback();
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default StadiumController; 