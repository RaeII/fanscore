import { getErrorMessage } from '@/helpers/response_collection';
import QuestDatabase from '@/database/Quest.database';
import { Quest, QuestBasicInfo, QuestForFront, QuestInsert, QuestUpdatePayload, QuestUpdate } from '../types';

class QuestService {
	private database: QuestDatabase;

	constructor() {
		this.database = new QuestDatabase();
	}

	async create(data: QuestInsert): Promise<number> {
		if (!data.name) throw Error(getErrorMessage('missingField', 'Nome da quest'));
		if (!data.description) throw Error(getErrorMessage('missingField', 'Descrição da quest'));
		if (!data.type) throw Error(getErrorMessage('missingField', 'Tipo da quest'));
		if (!data.scope) throw Error(getErrorMessage('missingField', 'Escopo da quest'));

		// Verificar se o tipo existe
		const questType = await this.database.fetchQuestType(data.type);
		if (!questType) throw Error(getErrorMessage('registryNotFound', 'Tipo de quest'));

		// Verificar se o escopo existe
		const questScope = await this.database.fetchQuestScope(data.scope);
		if (!questScope) throw Error(getErrorMessage('registryNotFound', 'Escopo de quest'));

		const insertData: QuestInsert = {
			name: data.name,
			description: data.description,
			image: data.image,
			point_value: data.point_value,
			type: data.type,
			scope: data.scope
		};

		const result: any = await this.database.create(insertData);
		return result[0].insertId;
	}

	async fetch(id: number): Promise<Quest | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id da quest'));

		return await this.database.fetch(id);
	}

	async fetchAll(): Promise<Array<QuestBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchForFront(id: number): Promise<QuestForFront | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id da quest'));

		return await this.database.fetchForFront(id);
	}

	async fetchByType(typeId: number): Promise<Array<QuestBasicInfo>> {
		if (!typeId) throw Error(getErrorMessage('missingField', 'Id do tipo de quest'));

		return await this.database.fetchByType(typeId);
	}

	async fetchByScope(scopeId: number): Promise<Array<QuestBasicInfo>> {
		if (!scopeId) throw Error(getErrorMessage('missingField', 'Id do escopo de quest'));

		return await this.database.fetchByScope(scopeId);
	}

	async fetchByName(name: string): Promise<Array<QuestBasicInfo>> {
		if (!name) throw Error(getErrorMessage('missingField', 'Nome da quest'));

		return await this.database.fetchByName(name);
	}

	async update(data: QuestUpdatePayload, id: number) {
		const toUpdate: QuestUpdate = {};

		if (data?.name) {
			toUpdate.name = data.name;
		}
		
		if (data?.description) {
			toUpdate.description = data.description;
		}

		if (data?.image !== undefined) {
			toUpdate.image = data.image;
		}

		if (data?.type) {
			// Verificar se o tipo existe
			const questType = await this.database.fetchQuestType(data.type);
			if (!questType) throw Error(getErrorMessage('registryNotFound', 'Tipo de quest'));
			
			toUpdate.type = data.type;
		}
		
		if (data?.scope) {
			// Verificar se o escopo existe
			const questScope = await this.database.fetchQuestScope(data.scope);
			if (!questScope) throw Error(getErrorMessage('registryNotFound', 'Escopo de quest'));
			
			toUpdate.scope = data.scope;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}

	async remove(id: number): Promise<void> {
		await this.database.delete(id);
	}

	async fetchQuestTypes() {
		return await this.database.fetchQuestTypes();
	}

	async fetchQuestScopes() {
		return await this.database.fetchQuestScopes();
	}
}

export default QuestService; 