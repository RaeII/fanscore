/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { QuestUser, QuestUserBasicInfo, QuestUserForFront, QuestUserInsert } from '../types/questUser';
import { Quest } from '../types/quest';

class QuestUserDatabase extends Database {

	async create(data: QuestUserInsert) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO quest_user SET ${mysqlBind}, register_date = now();`, Object.values(data));
	}

	async fetchForFront(id: number): Promise<QuestUserForFront | null> {
		const rows: any = await this.query(`
			SELECT
				qu.*,
				q.name as quest_name,
				q.description as quest_description,
				q.image as quest_image,
				q.type as quest_type,
				q.scope as quest_scope,
				q.point_value as quest_point_value
			FROM quest_user qu
			LEFT JOIN quest q ON qu.quest_id = q.id
			WHERE qu.id = ?;`, [id]);

		if (rows[0]?.length === 0) return null;

		const questUser = rows[0][0] as QuestUserForFront;
		
		if (questUser) {
			questUser.quest = {
				id: questUser.quest_id,
				name: rows[0][0].quest_name,
				description: rows[0][0].quest_description,
				image: rows[0][0].quest_image,
				type: rows[0][0].quest_type,
				scope: rows[0][0].quest_scope,
				point_value: rows[0][0].quest_point_value,
				register_date: new Date()
			};
		}

		return questUser;
	}

	async fetchAllQuestsWithUserCompletion(userId: number, scopeId?: number): Promise<any[]> {
		let query = `
			SELECT
				q.id,
				q.name,
				q.description,
				q.image,
				q.type,
				q.scope,
				q.point_value,
				qt.name as type_name,
				qs.name as scope_name,
				CASE WHEN qu.id IS NOT NULL THEN 1 ELSE 0 END as is_assigned,
				IFNULL(qu.status, 0) as status,
				qu.id as quest_user_id,
				qu.match_id
			FROM quest q
			LEFT JOIN quest_type qt ON q.type = qt.id
			LEFT JOIN quest_scope qs ON q.scope = qs.id
			LEFT JOIN quest_user qu ON q.id = qu.quest_id AND qu.user_id = ?
		`;

		const params = [userId];

		if (scopeId) {
			query += ` WHERE q.scope = ?`;
			params.push(scopeId);
		}

		query += ` ORDER BY q.scope, q.type, q.name`;

		const rows: any = await this.query(query, params);
		return rows[0];
	}

	async fetch(id: number): Promise<QuestUser | null> {
		const rows: any = await this.query('SELECT * FROM quest_user WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as QuestUser : null;
	}

	async fetchAll(): Promise<Array<QuestUserBasicInfo>> {
		const rows: any = await this.query(`
			SELECT 
				qu.id, 
				qu.user_id, 
				qu.quest_id, 
				qu.match_id, 
				qu.status
			FROM quest_user qu;`, []);

		return rows[0];
	}

	async fetchByUser(userId: number): Promise<Array<QuestUserBasicInfo>> {
		const rows: any = await this.query(`
			SELECT 
				qu.id, 
				qu.user_id, 
				qu.quest_id, 
				qu.match_id, 
				qu.status
			FROM quest_user qu
			WHERE qu.user_id = ?;`, [userId]);

		return rows[0];
	}

	async fetchByQuest(questId: number): Promise<Array<QuestUserBasicInfo>> {
		const rows: any = await this.query(`
			SELECT 
				qu.id, 
				qu.user_id, 
				qu.quest_id, 
				qu.match_id, 
				qu.status
			FROM quest_user qu
			WHERE qu.quest_id = ?;`, [questId]);

		return rows[0];
	}

	async fetchByMatch(matchId: number): Promise<Array<QuestUserBasicInfo>> {
		const rows: any = await this.query(`
			SELECT 
				qu.id, 
				qu.user_id, 
				qu.quest_id, 
				qu.match_id, 
				qu.status
			FROM quest_user qu
			WHERE qu.match_id = ?;`, [matchId]);

		return rows[0];
	}

	async fetchCompletedByUser(userId: number): Promise<Array<QuestUserBasicInfo>> {
		const rows: any = await this.query(`
			SELECT 
				qu.id, 
				qu.user_id, 
				qu.quest_id, 
				qu.match_id, 
				qu.status
			FROM quest_user qu
			WHERE qu.user_id = ? AND qu.status = 1;`, [userId]);

		return rows[0];
	}

	async fetchByUserAndQuest(userId: number, questId: number): Promise<QuestUser | null> {
		const rows: any = await this.query(`
			SELECT * 
			FROM quest_user 
			WHERE user_id = ? AND quest_id = ?;`, [userId, questId]);

		return rows[0]?.length > 0 ? rows[0][0] as QuestUser : null;
	}

	async update(data: any, id: number) {
		// Filtra valores undefined
		const filteredData = Object.fromEntries(
			Object.entries(data).filter(([_, value]) => value !== undefined)
		);
		
		const mysqlBind = createBindParams(filteredData);

		return await this.query(`UPDATE quest_user SET ${mysqlBind}, update_date = now() WHERE id = ?;`, 
			[...Object.values(filteredData), id]);
	}

	async delete(id: number) {
		return await this.query('DELETE FROM quest_user WHERE id = ?;', [id]);
	}
}

export default QuestUserDatabase; 