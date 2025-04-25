/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { UserAccount, UserAccountBasicInfo, UserAccountForFront, UserAccountInsert } from '../types';

class UserDatabase extends Database {

	async create(data: UserAccountInsert) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO user SET ${mysqlBind};`, Object.values(data));
	}

	async fetchForFront(id: number): Promise<UserAccountForFront | null> {
		const rows: any = await this.query(`
			SELECT
				id,
				name,
				wallet_address,
				register_date
			FROM user
			WHERE id = ?;`, [id]);

		return rows[0]?.length > 0 ? rows[0][0] as UserAccountForFront : null;
	}

	async fetch(id: number): Promise<UserAccount | null> {
		const rows: any = await this.query('SELECT * FROM user WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as UserAccount : null;
	}

	async fetchAll(): Promise<Array<UserAccountBasicInfo>> {
		const rows: any = await this.query('SELECT id, name, wallet_address FROM user;', []);

		return rows[0];
	}

	async fetchIfUsernameExist(username: string): Promise<number | null> {
		const rows: any = await this.query('SELECT id FROM user WHERE name = ?;', [username]);

		return rows[0]?.length > 0 ? rows[0][0]['id'] : null;
	}

	async fetchByUsername(username: string): Promise<Array<UserAccountBasicInfo>> {
		const rows = await this.query('SELECT id, name, wallet_address FROM user WHERE name = ?;', [username]);

		return rows[0] as Array<UserAccountBasicInfo>;
	}

	async fetchByEmail(email: string): Promise<UserAccountBasicInfo | null> {
		const rows: any = await this.query('SELECT id, name, wallet_address FROM user WHERE wallet_address = ?;', [email]);

		return rows[0]?.length > 0 ? rows[0][0] as UserAccountBasicInfo : null;
	}

	async fetchByEmailOrUsername(login: string): Promise<UserAccountBasicInfo | null> {
		const rows: any = await this.query('SELECT id, name, wallet_address FROM user WHERE name = ? OR wallet_address = ?;', [login, login]);

		return rows[0]?.length > 0 ? rows[0][0] as UserAccountBasicInfo : null;
	}

	async update(data: any, id: number) {
		const mysqlBind = createBindParams(data);

		return await this.query(`UPDATE user SET ${mysqlBind}, update_date = now() WHERE id = ?;`, [...Object.values(data), id]);
	}

	async delete(id: number) {
		return await this.query('DELETE FROM user WHERE id = ?;', [id]);
	}
}

export default UserDatabase;
