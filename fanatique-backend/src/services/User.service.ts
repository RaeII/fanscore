import { getErrorMessage } from '@/helpers/response_collection';
import UserDatabase from '@/database/User.database';
import { assertUsernameCharacters } from '@/helpers/util';
import { UserAccount, UserAccountBasicInfo, UserAccountForFront, UserAccountInsert, UserAccountUpdatePayload, UserAccountUpdate } from '../types';

class UserService {
	private database: UserDatabase;

	constructor() {
		this.database = new UserDatabase();
	}

	async create(data: UserAccountInsert): Promise<number> {
		if (!data.name) throw Error(getErrorMessage('missingField', 'Nome de usuario'));
		if (!data.wallet_address) throw Error(getErrorMessage('missingField', 'Endereço da carteira'));
		
		assertUsernameCharacters(data.name);
		const userByUsername = await this.fetchByUsername(data.name);
		if (userByUsername !== null) throw Error(getErrorMessage('userAlreadyExist'));

		const insertData: UserAccountInsert = {
			name: data.name,
			wallet_address: data.wallet_address
		};

		const result: any = await this.database.create(insertData);
		return result[0].insertId;
	}

	async fetch(id: number): Promise<UserAccount | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id de usuario'));

		return await this.database.fetch(id);
	}

	async fetchAll(): Promise<Array<UserAccountBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchForFront(id: number): Promise<UserAccountForFront | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id de usuario'));

		return await this.database.fetchForFront(id);
	}

	async fetchByUsername(username: string): Promise<UserAccountBasicInfo | null> {
		if (!username) throw Error(getErrorMessage('missingField', 'Nome de usuario'));

		const user = await this.database.fetchByUsername(username);

		return user.length > 0 ? user[0] : null;
	}

	async fetchByEmail(wallet_address: string): Promise<UserAccountBasicInfo | null> {
		if (!wallet_address) throw Error(getErrorMessage('missingField', 'Endereço da carteira'));

		return await this.database.fetchByEmail(wallet_address);
	}

	async fetchByEmailOrUsername(login: string): Promise<UserAccountBasicInfo | null> {
		if (!login) throw Error(getErrorMessage('missingField', 'Login'));

		return await this.database.fetchByEmailOrUsername(login);
	}

	async fetchIsUsernameUnique(username: string): Promise<boolean> {
		if (username.length === 0) throw Error(getErrorMessage('missingField', 'Nome do usuario'));

		const user = await this.database.fetchIfUsernameExist(username);

		return user === null;
	}

	async update(data: UserAccountUpdatePayload, id: number) {
		const toUpdate: UserAccountUpdate = {};

		if (data?.name) {
			assertUsernameCharacters(data.name);
			const user: UserAccountBasicInfo | null = await this.fetchByUsername(data.name);

			if (user !== null) throw Error(getErrorMessage('userAlreadyExist'));

			toUpdate.name = data.name;
		}
		
		if (data?.wallet_address) {
			const userByWallet = await this.database.fetchByEmail(data.wallet_address);

			if (userByWallet) throw Error(getErrorMessage('userAlreadyExist'));
			toUpdate.wallet_address = data.wallet_address;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}

	async remove(id: number): Promise<void> {
		await this.database.delete(id);
	}
}

export default UserService;
