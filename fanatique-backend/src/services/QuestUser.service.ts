import { getErrorMessage } from '@/helpers/response_collection';
import QuestUserDatabase from '@/database/QuestUser.database';
import QuestDatabase from '@/database/Quest.database';
import UserDatabase from '@/database/User.database';
import MatchDatabase from '@/database/Match.database';
import { QuestUser, QuestUserBasicInfo, QuestUserForFront, QuestUserInsert, QuestUserUpdatePayload, QuestUserUpdate } from '../types/questUser';

class QuestUserService {
	private database: QuestUserDatabase;
	private questDatabase: QuestDatabase;
	private userDatabase: UserDatabase;
	private matchDatabase: MatchDatabase;

	constructor() {
		this.database = new QuestUserDatabase();
		this.questDatabase = new QuestDatabase();
		this.userDatabase = new UserDatabase();
		this.matchDatabase = new MatchDatabase();
	}

	async create(data: QuestUserInsert): Promise<number> {
		if (!data.user_id) throw Error(getErrorMessage('missingField', 'ID do usuário'));
		if (!data.quest_id) throw Error(getErrorMessage('missingField', 'ID da quest'));

		// Verificar se o usuário existe
		const user = await this.userDatabase.fetch(data.user_id);
		if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuário'));

		// Verificar se a quest existe
		const quest = await this.questDatabase.fetch(data.quest_id);
		if (!quest) throw Error(getErrorMessage('registryNotFound', 'Quest'));

		// Verificar se o match existe, se foi fornecido
		if (data.match_id) {
			const match = await this.matchDatabase.fetch(data.match_id);
			if (!match) throw Error(getErrorMessage('registryNotFound', 'Partida'));
		}

		// Verificar se o usuário já tem essa quest
		const existingQuestUser = await this.database.fetchByUserAndQuest(data.user_id, data.quest_id);
		if (existingQuestUser) {
			throw Error(getErrorMessage('alreadyExists', 'Quest já atribuída a este usuário'));
		}

		const insertData: QuestUserInsert = {
			user_id: data.user_id,
			quest_id: data.quest_id,
			match_id: data.match_id,
			status: data.status || 0
		};

		const result: any = await this.database.create(insertData);
		return result[0].insertId;
	}

	async fetch(id: number): Promise<QuestUser | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'ID da QuestUser'));

		return await this.database.fetch(id);
	}

	async fetchForFront(id: number): Promise<QuestUserForFront | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'ID da QuestUser'));

		return await this.database.fetchForFront(id);
	}

	async fetchAll(): Promise<Array<QuestUserBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchAllQuestsWithUserCompletion(userId: number, scopeId?: number): Promise<any[]> {
		if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

		// Verificar se o usuário existe
		const user = await this.userDatabase.fetch(userId);
		if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuário'));

		// Se scopeId foi informado, verificar se existe
		if (scopeId) {
			const scope = await this.questDatabase.fetchQuestScope(scopeId);
			if (!scope) throw Error(getErrorMessage('registryNotFound', 'Escopo de quest'));
		}

		const response = await this.database.fetchAllQuestsWithUserCompletion(userId, scopeId);

		return response;
	}

	async fetchByUser(userId: number): Promise<Array<QuestUserBasicInfo>> {
		if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

		// Verificar se o usuário existe
		const user = await this.userDatabase.fetch(userId);
		if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuário'));

		return await this.database.fetchByUser(userId);
	}

	async fetchByQuest(questId: number): Promise<Array<QuestUserBasicInfo>> {
		if (!questId) throw Error(getErrorMessage('missingField', 'ID da quest'));

		// Verificar se a quest existe
		const quest = await this.questDatabase.fetch(questId);
		if (!quest) throw Error(getErrorMessage('registryNotFound', 'Quest'));

		return await this.database.fetchByQuest(questId);
	}

	async fetchByMatch(matchId: number): Promise<Array<QuestUserBasicInfo>> {
		if (!matchId) throw Error(getErrorMessage('missingField', 'ID da partida'));

		// Verificar se o match existe
		const match = await this.matchDatabase.fetch(matchId);
		if (!match) throw Error(getErrorMessage('registryNotFound', 'Partida'));

		return await this.database.fetchByMatch(matchId);
	}

	async fetchCompletedByUser(userId: number): Promise<Array<QuestUserBasicInfo>> {
		if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

		// Verificar se o usuário existe
		const user = await this.userDatabase.fetch(userId);
		if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuário'));

		return await this.database.fetchCompletedByUser(userId);
	}

	async update(data: QuestUserUpdatePayload, id: number) {
		const questUser = await this.fetch(id);
		if (!questUser) throw Error(getErrorMessage('registryNotFound', 'QuestUser'));

		const toUpdate: QuestUserUpdate = {};

		if (data.status !== undefined) {
			toUpdate.status = data.status;
		}

		if (data.match_id !== undefined) {
			if (data.match_id !== null) {
				// Verificar se o match existe, se foi fornecido
				const match = await this.matchDatabase.fetch(data.match_id);
				if (!match) throw Error(getErrorMessage('registryNotFound', 'Partida'));
			}
			toUpdate.match_id = data.match_id;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}

	async completeQuest(id: number) {
		const questUser = await this.fetch(id);
		if (!questUser) throw Error(getErrorMessage('registryNotFound', 'QuestUser'));

		if (questUser.status === 1) {
			throw Error(getErrorMessage('alreadyCompleted', 'Quest já foi completada'));
		}

		await this.database.update({ status: 1 }, id);
	}

	async remove(id: number): Promise<void> {
		const questUser = await this.fetch(id);
		if (!questUser) throw Error(getErrorMessage('registryNotFound', 'QuestUser'));

		await this.database.delete(id);
	}
}

export default QuestUserService; 