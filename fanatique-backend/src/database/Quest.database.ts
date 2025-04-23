/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { Quest, QuestBasicInfo, QuestForFront, QuestInsert } from '../types';

class QuestDatabase extends Database {

	async create(data: QuestInsert) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO quest SET ${mysqlBind}, register_date = now();`, Object.values(data));
	}

	async fetchForFront(id: number): Promise<QuestForFront | null> {
		const rows: any = await this.query(`
			SELECT
				q.id,
				q.name,
				q.description,
				q.image,
				q.type,
				q.scope,
				q.point_value,
				qt.name as typeName,
				qs.name as scopeName
			FROM quest q
			LEFT JOIN quest_type qt ON q.type = qt.id
			LEFT JOIN quest_scope qs ON q.scope = qs.id
			WHERE q.id = ?;`, [id]);

		return rows[0]?.length > 0 ? rows[0][0] as QuestForFront : null;
	}

	async fetch(id: number): Promise<Quest | null> {
		const rows: any = await this.query('SELECT * FROM quest WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as Quest : null;
	}

	async fetchAll(): Promise<Array<QuestBasicInfo>> {
		const rows: any = await this.query(`
			SELECT 
				q.id, 
				q.name, 
				q.description, 
				q.image, 
				q.type, 
				q.scope,
				q.point_value,
				qt.name as typeName,
				qs.name as scopeName
			FROM quest q
			LEFT JOIN quest_type qt ON q.type = qt.id
			LEFT JOIN quest_scope qs ON q.scope = qs.id;`, []);

		return rows[0];
	}

	async fetchByName(name: string): Promise<Array<QuestBasicInfo>> {
		const rows = await this.query(`
			SELECT 
				q.id, 
				q.name, 
				q.description, 
				q.image, 
				q.type, 
				q.scope,
				q.point_value,
				qt.name as typeName,
				qs.name as scopeName
			FROM quest q
			LEFT JOIN quest_type qt ON q.type = qt.id
			LEFT JOIN quest_scope qs ON q.scope = qs.id
			WHERE q.name LIKE ?;`, [`%${name}%`]);

		return rows[0] as Array<QuestBasicInfo>;
	}

	async fetchByType(typeId: number): Promise<Array<QuestBasicInfo>> {
		const rows: any = await this.query(`
			SELECT 
				q.id, 
				q.name, 
				q.description, 
				q.image, 
				q.point_value,
				q.type, 
				q.scope,
				qt.name as typeName,
				qs.name as scopeName
			FROM quest q
			LEFT JOIN quest_type qt ON q.type = qt.id
			LEFT JOIN quest_scope qs ON q.scope = qs.id
			WHERE q.type = ?;`, [typeId]);

		return rows[0];
	}

	async fetchByScope(scopeId: number): Promise<Array<QuestBasicInfo>> {
		const rows: any = await this.query(`
			SELECT 
				q.id, 
				q.name, 
				q.description, 
				q.image, 
				q.point_value,
				q.type, 
				q.scope,
				qt.name as typeName,
				qs.name as scopeName
			FROM quest q
			LEFT JOIN quest_type qt ON q.type = qt.id
			LEFT JOIN quest_scope qs ON q.scope = qs.id
			WHERE q.scope = ?;`, [scopeId]);

		return rows[0];
	}

	async update(data: any, id: number) {
		// Filtra valores undefined
		const filteredData = Object.fromEntries(
			Object.entries(data).filter(([_, value]) => value !== undefined)
		);
		
		const mysqlBind = createBindParams(filteredData);

		return await this.query(`UPDATE quest SET ${mysqlBind}, update_date = now() WHERE id = ?;`, [...Object.values(filteredData), id]);
	}

	async delete(id: number) {
		return await this.query('DELETE FROM quest WHERE id = ?;', [id]);
	}

	async fetchQuestTypes(): Promise<any[]> {
		const rows = await this.query('SELECT id, name FROM quest_type;', []);
		return rows[0];
	}

	async fetchQuestScopes(): Promise<any[]> {
		const rows = await this.query('SELECT id, name FROM quest_scope;', []);
		return rows[0];
	}

	async fetchQuestType(id: number): Promise<any | null> {
		const rows = await this.query('SELECT id, name FROM quest_type WHERE id = ?;', [id]);
		return rows[0]?.length > 0 ? rows[0][0] : null;
	}

	async fetchQuestScope(id: number): Promise<any | null> {
		const rows = await this.query('SELECT id, name FROM quest_scope WHERE id = ?;', [id]);
		return rows[0]?.length > 0 ? rows[0][0] : null;
	}
}

export default QuestDatabase; 