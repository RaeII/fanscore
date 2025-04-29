/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { Club, ClubBasicInfo, ClubForFront, ClubInsert } from '../types';

class ClubDatabase extends Database {

	async create(data: ClubInsert) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO club SET ${mysqlBind};`, Object.values(data));
	}

	async fetchForFront(id: number): Promise<ClubForFront | null> {
		const rows: any = await this.query(`
			SELECT
				id,
				name,
				image,
				symbol
			FROM club
			WHERE id = ?;`, [id]);

		return rows[0]?.length > 0 ? rows[0][0] as ClubForFront : null;
	}

	async fetch(id: number): Promise<Club | null> {
		const rows: any = await this.query('SELECT * FROM club WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as Club : null;
	}

	async fetchAll(): Promise<Array<ClubBasicInfo>> {
		const rows: any = await this.query('SELECT id, name, image, symbol FROM club;', []);

		return rows[0];
	}

	async fetchByName(name: string): Promise<Array<ClubBasicInfo>> {
		const rows = await this.query('SELECT id, name, image, symbol FROM club WHERE name = ?;', [name]);

		return rows[0] as Array<ClubBasicInfo>;
	}

	async update(data: any, id: number) {
		const mysqlBind = createBindParams(data);

		return await this.query(`UPDATE club SET ${mysqlBind}, update_date = now() WHERE id = ?;`, [...Object.values(data), id]);
	}

	async delete(id: number) {
		return await this.query('DELETE FROM club WHERE id = ?;', [id]);
	}
}

export default ClubDatabase; 