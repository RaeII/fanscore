/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { Stadium, StadiumBasicInfo, StadiumForFront, StadiumInsert } from '../types';

class StadiumDatabase extends Database {

	async create(data: StadiumInsert) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO stadium SET ${mysqlBind};`, Object.values(data));
	}

	async fetchForFront(id: number): Promise<StadiumForFront | null> {
		const rows: any = await this.query(`
			SELECT
				id,
				name,
				image,
				city,
				state,
				club_id
			FROM stadium
			WHERE id = ?;`, [id]);

		return rows[0]?.length > 0 ? rows[0][0] as StadiumForFront : null;
	}

	async fetch(id: number): Promise<Stadium | null> {
		const rows: any = await this.query('SELECT * FROM stadium WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as Stadium : null;
	}

	async fetchAll(): Promise<Array<StadiumBasicInfo>> {
		const rows: any = await this.query('SELECT id, name, image, city, state FROM stadium;', []);

		return rows[0];
	}

	async fetchByName(name: string): Promise<Array<StadiumBasicInfo>> {
		const rows = await this.query('SELECT id, name, image, city, state FROM stadium WHERE name = ?;', [name]);

		return rows[0] as Array<StadiumBasicInfo>;
	}

	async fetchByClubId(clubId: number): Promise<Stadium | null> {
		const rows: any = await this.query('SELECT * FROM stadium WHERE club_id = ?;', [clubId]);

		return rows[0]?.length > 0 ? rows[0][0] as Stadium : null;
	}

	async update(data: any, id: number) {
		const mysqlBind = createBindParams(data);

		return await this.query(`UPDATE stadium SET ${mysqlBind}, update_date = now() WHERE id = ?;`, [...Object.values(data), id]);
	}

	async delete(id: number) {
		return await this.query('DELETE FROM stadium WHERE id = ?;', [id]);
	}
}

export default StadiumDatabase; 