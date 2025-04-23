import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import QuestService from '@/services/Quest.service';
import Database from '@/database/Database';
import { Quest, QuestForFront, QuestInsert, QuestUpdatePayload } from '@/types';

class QuestController extends Controller {
	private service: QuestService;

	constructor() {
		super();
		this.service = new QuestService();
	}

	async create(req: Request, res: Response) {
		try {
			const body: QuestInsert = {
				name: req.body.name,
				description: req.body.description,
				image: req.body?.image,
				point_value: req.body.point_value,
				type: req.body.type,
				scope: req.body.scope
			};

			await Database.startTransaction();
			const questId = await this.service.create(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: { id: questId }, 
				message: getSuccessMessage('create', 'Quest') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			console.log(err);
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const questId: number = Number(req.params.id);

			const quest: QuestForFront | null = await this.service.fetchForFront(questId);
			if (!quest) throw Error(getErrorMessage('registryNotFound', 'Quest'));

			return this.sendSuccessResponse(res, { content: quest });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const quests = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: quests });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByType(req: Request, res: Response) {
		try {
			const typeId: number = Number(req.params.typeId);
			
			const quests = await this.service.fetchByType(typeId);
			return this.sendSuccessResponse(res, { content: quests });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByScope(req: Request, res: Response) {
		try {
			const scopeId: number = Number(req.params.scopeId);
			
			const quests = await this.service.fetchByScope(scopeId);
			return this.sendSuccessResponse(res, { content: quests });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchQuestTypes(req: Request, res: Response) {
		try {
			const types = await this.service.fetchQuestTypes();
			return this.sendSuccessResponse(res, { content: types });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchQuestScopes(req: Request, res: Response) {
		try {
			const scopes = await this.service.fetchQuestScopes();
			return this.sendSuccessResponse(res, { content: scopes });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: QuestUpdatePayload = {
				name: req.body.name,
				description: req.body.description,
				image: req.body.image,
				type: req.body.type,
				scope: req.body.scope
			};
			const questId: number = Number(req.params.id);

			const quest: Quest | null = await this.service.fetch(questId);

			if (!quest) throw Error(getErrorMessage('registryNotFound', 'Quest'));

			await this.service.update(body, questId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Quest') });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const questId: number = Number(req.params.id);
			
			const quest: Quest | null = await this.service.fetch(questId);
			if (!quest) throw Error(getErrorMessage('registryNotFound', 'Quest'));
			
			Database.startTransaction();
			await this.service.remove(questId);
			Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'Quest') });
		} catch (err) {
			Database.rollback();
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default QuestController; 