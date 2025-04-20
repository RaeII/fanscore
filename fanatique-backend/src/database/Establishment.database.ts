/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { Establishment, EstablishmentBasicInfo, EstablishmentForFront, EstablishmentInsert } from '../types';

class EstablishmentDatabase extends Database {

	async create(data: EstablishmentInsert) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO establishment SET ${mysqlBind};`, Object.values(data));
	}

	async fetchForFront(id: number): Promise<EstablishmentForFront | null> {
		const rows: any = await this.query(`
			SELECT
				id,
				name,
				segment,
				image
			FROM establishment
			WHERE id = ?;`, [id]);

		return rows[0]?.length > 0 ? rows[0][0] as EstablishmentForFront : null;
	}

	async fetch(id: number): Promise<Establishment | null> {
		const rows: any = await this.query('SELECT * FROM establishment WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as Establishment : null;
	}

	async fetchAll(): Promise<Array<EstablishmentBasicInfo>> {
		const rows: any = await this.query('SELECT id, name, segment, image FROM establishment;', []);

		return rows[0];
	}

	async fetchByName(name: string): Promise<Array<EstablishmentBasicInfo>> {
		const rows = await this.query('SELECT id, name, segment, image FROM establishment WHERE name = ?;', [name]);

		return rows[0] as Array<EstablishmentBasicInfo>;
	}

	async update(data: any, id: number) {
		const mysqlBind = createBindParams(data);

		return await this.query(`UPDATE establishment SET ${mysqlBind}, update_date = now() WHERE id = ?;`, [...Object.values(data), id]);
	}

	async delete(id: number) {
		return await this.query('DELETE FROM establishment WHERE id = ?;', [id]);
	}
}

export default EstablishmentDatabase; 