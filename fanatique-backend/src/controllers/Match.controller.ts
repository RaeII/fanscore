import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import MatchService from '@/services/Match.service';
import Database from '@/database/Database';
import { Match, MatchDetailedInfo, MatchForFront, MatchInsert, MatchUpdatePayload } from '@/types';

class MatchController extends Controller {
	private service: MatchService;

	constructor() {
		super();
		this.service = new MatchService();
	}

	async create(req: Request, res: Response) {
		try {
			const body: MatchInsert = {
				home_club_id: Number(req.body.home_club_id),
				away_club_id: Number(req.body.away_club_id),
				stadium_id: Number(req.body.stadium_id),
				match_date: new Date(req.body.match_date),
				is_started: req.body.is_started ? 1 : 0
			};

			// Validar os campos obrigatórios
			if (!body.home_club_id) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Clube mandante')));
			}

			if (!body.away_club_id) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Clube visitante')));
			}
			
			if (!body.stadium_id) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Estádio')));
			}
			
			if (!body.match_date) {
				return this.sendErrorMessage(res, new Error(getErrorMessage('missingField', 'Data da partida')));
			}

			await Database.startTransaction();
			const matchId = await this.service.create(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { content: { id: matchId }, message: getSuccessMessage('create', 'Partida') });
		} catch (err) {
			await Database.rollback().catch(console.log);
			console.log(err);
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const matchId: number = Number(req.params.id);

			const match: MatchForFront | null = await this.service.fetchForFront(matchId);
			if (!match) throw Error(getErrorMessage('registryNotFound', 'Partida'));
			
			// Verificar se as informações estão presentes
			if (!match.stadium) {
				throw Error(getErrorMessage('registryNotFound', 'Informações do estádio para esta partida'));
			}
			
			if (!match.home_club) {
				throw Error(getErrorMessage('registryNotFound', 'Informações do clube mandante para esta partida'));
			}
			
			if (!match.away_club) {
				throw Error(getErrorMessage('registryNotFound', 'Informações do clube visitante para esta partida'));
			}

			return this.sendSuccessResponse(res, { content: match });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const matches = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: matches });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}
	
	async fetchByClubId(req: Request, res: Response) {
		try {
			const clubId: number = Number(req.params.clubId);

			const matches = await this.service.fetchByClubId(clubId);
			
			return this.sendSuccessResponse(res, { content: matches });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}
	
	async fetchByStadiumId(req: Request, res: Response) {
		try {
			const stadiumId: number = Number(req.params.stadiumId);

			const matches = await this.service.fetchByStadiumId(stadiumId);
			if (!matches.length) throw Error(getErrorMessage('registryNotFound', 'Partidas para este estádio'));

			return this.sendSuccessResponse(res, { content: matches });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: MatchUpdatePayload = {
				home_club_id: req.body.home_club_id ? Number(req.body.home_club_id) : undefined,
				away_club_id: req.body.away_club_id ? Number(req.body.away_club_id) : undefined,
				stadium_id: req.body.stadium_id ? Number(req.body.stadium_id) : undefined,
				match_date: req.body.match_date ? new Date(req.body.match_date) : undefined,
				is_started: req.body.is_started !== undefined ? (req.body.is_started ? 1 : 0) : undefined
			};
			const matchId: number = Number(req.params.id);

			const match: Match | null = await this.service.fetch(matchId);

			if (!match) throw Error(getErrorMessage('registryNotFound', 'Partida'));

			await Database.startTransaction();
			await this.service.update(body, matchId);
			await Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Partida') });
		} catch (err) {
			await Database.rollback().catch(console.log);
			return await this.sendErrorMessage(res, err);
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const matchId: number = Number(req.params.id);
			
			const match: Match | null = await this.service.fetch(matchId);
			if (!match) throw Error(getErrorMessage('registryNotFound', 'Partida'));
			
			await Database.startTransaction();
			await this.service.remove(matchId);
			await Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'Partida') });
		} catch (err) {
			await Database.rollback().catch(console.log);
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default MatchController; 