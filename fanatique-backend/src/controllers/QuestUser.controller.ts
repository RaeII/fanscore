import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import QuestUserService from '@/services/QuestUser.service';
import Database from '@/database/Database';
import { QuestUser, QuestUserForFront, QuestUserInsert, QuestUserUpdatePayload } from '@/types/questUser';

class QuestUserController extends Controller {
	private service: QuestUserService;

	constructor() {
		super();
		this.service = new QuestUserService();
	}

	async create(req: Request, res: Response) {
		try {

			const userId: number = Number(res.locals.jwt.user_id);

			const body: QuestUserInsert = {
				user_id: userId,
				quest_id: req.body.quest_id,
				match_id: req.body.match_id,
				status: req.body.status || 0
			};

			await Database.startTransaction();
			const questUserId = await this.service.create(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: { id: questUserId }, 
				message: getSuccessMessage('create', 'QuestUser') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			console.log(err);
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const questUserId: number = Number(req.params.id);

			const questUser: QuestUserForFront | null = await this.service.fetchForFront(questUserId);
			if (!questUser) throw Error(getErrorMessage('registryNotFound', 'QuestUser'));

			return this.sendSuccessResponse(res, { content: questUser });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const questUsers = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: questUsers });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAllQuestsWithUserCompletion(req: Request, res: Response) {
		try {
			const userId: number = Number(res.locals.jwt.user_id);
			const scopeId: any = req?.query?.scope_id ? Number(req?.query?.scope_id) : undefined;
			
			const questsWithCompletion = await this.service.fetchAllQuestsWithUserCompletion(userId, scopeId);

			return this.sendSuccessResponse(res, { content: questsWithCompletion });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByUser(req: Request, res: Response) {
		try {
			const userId: number = Number(res.locals.jwt.user_id);
			
			const questUsers = await this.service.fetchByUser(userId);
			return this.sendSuccessResponse(res, { content: questUsers });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByQuest(req: Request, res: Response) {
		try {
			const questId: number = Number(req.params.questId);
			
			const questUsers = await this.service.fetchByQuest(questId);
			return this.sendSuccessResponse(res, { content: questUsers });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByMatch(req: Request, res: Response) {
		try {
			const matchId: number = Number(req.params.matchId);
			
			const questUsers = await this.service.fetchByMatch(matchId);
			return this.sendSuccessResponse(res, { content: questUsers });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchCompletedByUser(req: Request, res: Response) {
		try {
			const userId: number = Number(res.locals.jwt.user_id);
			
			const questUsers = await this.service.fetchCompletedByUser(userId);
			return this.sendSuccessResponse(res, { content: questUsers });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: QuestUserUpdatePayload = {
				status: req.body.status !== undefined ? req.body.status : undefined,
				match_id: req.body.match_id !== undefined ? req.body.match_id : undefined
			};
			const questUserId: number = Number(req.params.id);

			const questUser: QuestUser | null = await this.service.fetch(questUserId);
			if (!questUser) throw Error(getErrorMessage('registryNotFound', 'QuestUser'));

			await this.service.update(body, questUserId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'QuestUser') });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async completeQuest(req: Request, res: Response) {
		try {
			const questUserId: number = Number(req.params.id);
			
			const questUser: QuestUser | null = await this.service.fetch(questUserId);
			if (!questUser) throw Error(getErrorMessage('registryNotFound', 'QuestUser'));

			await this.service.completeQuest(questUserId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Quest completada com sucesso') });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const questUserId: number = Number(req.params.id);
			
			const questUser: QuestUser | null = await this.service.fetch(questUserId);
			if (!questUser) throw Error(getErrorMessage('registryNotFound', 'QuestUser'));
			
			Database.startTransaction();
			await this.service.remove(questUserId);
			Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'QuestUser') });
		} catch (err) {
			Database.rollback();
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default QuestUserController; 