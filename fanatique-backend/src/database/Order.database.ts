/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { Order, OrderBasicInfo, OrderForFront } from '../types';

class OrderDatabase extends Database {

	async create(data: any) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO \`order\` SET ${mysqlBind};`, Object.values(data));
	}

	async fetchForFront(id: number): Promise<OrderForFront | null> {
		const rows: any = await this.query(`
			SELECT
				o.id,
				o.establishment_id,
				e.name as establishment_name,
				o.user_id,
				o.match_id,
				o.status_id,
				os.name as status_name,
				o.total_real,
				o.total_fantoken,
				o.date_register
			FROM \`order\` o
			LEFT JOIN establishment e ON o.establishment_id = e.id
			LEFT JOIN order_status os ON o.status_id = os.id
			WHERE o.id = ?;`, [id]);

		return rows[0]?.length > 0 ? rows[0][0] as OrderForFront : null;
	}

	async fetch(id: number): Promise<Order | null> {
		const rows: any = await this.query('SELECT * FROM `order` WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as Order : null;
	}

	async fetchAll(): Promise<Array<OrderBasicInfo>> {
		const rows: any = await this.query(`
			SELECT
				o.id,
				o.establishment_id,
				e.name as establishment_name,
				o.user_id,
				o.match_id,
				o.status_id,
				os.name as status_name,
				o.total_real,
				o.total_fantoken
			FROM \`order\` o
			LEFT JOIN establishment e ON o.establishment_id = e.id
			LEFT JOIN order_status os ON o.status_id = os.id
			ORDER BY o.date_register DESC;`, []);

		return rows[0];
	}

	async fetchByUser(userId: number): Promise<Array<OrderBasicInfo>> {
		const rows: any = await this.query(`
			SELECT
				o.id,
				o.establishment_id,
				e.name as establishment_name,
				o.user_id,
				o.match_id,
				o.status_id,
				os.name as status_name,
				o.total_real,
				o.total_fantoken
			FROM \`order\` o
			LEFT JOIN establishment e ON o.establishment_id = e.id
			LEFT JOIN order_status os ON o.status_id = os.id
			WHERE o.user_id = ?
			ORDER BY o.date_register DESC;`, [userId]);

		return rows[0];
	}

	async fetchByEstablishment(establishmentId: number): Promise<Array<OrderBasicInfo>> {
		const rows: any = await this.query(`
			SELECT
				o.id,
				o.establishment_id,
				e.name as establishment_name,
				o.user_id,
				o.match_id,
				o.status_id,
				os.name as status_name,
				o.total_real,
				o.total_fantoken
			FROM \`order\` o
			LEFT JOIN establishment e ON o.establishment_id = e.id
			LEFT JOIN order_status os ON o.status_id = os.id
			WHERE o.establishment_id = ?
			ORDER BY o.date_register DESC;`, [establishmentId]);

		return rows[0];
	}

	async fetchByMatch(matchId: number): Promise<Array<OrderBasicInfo>> {
		const rows: any = await this.query(`
			SELECT
				o.id,
				o.establishment_id,
				e.name as establishment_name,
				o.user_id,
				o.match_id,
				o.status_id,
				os.name as status_name,
				o.total_real,
				o.total_fantoken
			FROM \`order\` o
			LEFT JOIN establishment e ON o.establishment_id = e.id
			LEFT JOIN order_status os ON o.status_id = os.id
			WHERE o.match_id = ?
			ORDER BY o.date_register DESC;`, [matchId]);

		return rows[0];
	}

	async checkStatusExists(statusId: number): Promise<boolean> {
		const rows: any = await this.query(`
			SELECT id FROM order_status WHERE id = ?;`, [statusId]);
		
		return rows[0]?.length > 0;
	}

	async update(data: any, id: number) {
		// Filtra valores undefined
		const filteredData = Object.fromEntries(
			Object.entries(data).filter(([_, value]) => value !== undefined)
		);
		
		const mysqlBind = createBindParams(filteredData);

		return await this.query(`UPDATE \`order\` SET ${mysqlBind} WHERE id = ?;`, [...Object.values(filteredData), id]);
	}
}

export default OrderDatabase; 