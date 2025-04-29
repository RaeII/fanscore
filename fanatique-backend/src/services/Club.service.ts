import { getErrorMessage } from '@/helpers/response_collection';
import ClubDatabase from '@/database/Club.database';
import { Club, ClubBasicInfo, ClubForFront, ClubInsert, ClubUpdatePayload, ClubUpdate } from '../types';

class ClubService {
	private database: ClubDatabase;

	constructor() {
		this.database = new ClubDatabase();
	}

	async create(data: ClubInsert): Promise<number> {
		if (!data.name) throw Error(getErrorMessage('missingField', 'Nome do clube'));
		if (!data.image) throw Error(getErrorMessage('missingField', 'Imagem do clube'));
		if (!data.symbol) throw Error(getErrorMessage('missingField', 'Símbolo do clube'));
		const clubByName = await this.fetchByName(data.name);
		if (clubByName.length > 0) throw Error(getErrorMessage('clubAlreadyExist'));

		const insertData: ClubInsert = {
			name: data.name,
			image: data.image,
			symbol: data.symbol
		};

		const result: any = await this.database.create(insertData);
		return result[0].insertId;
	}

	async fetch(id: number): Promise<Club | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do clube'));

		return await this.database.fetch(id);
	}

	async fetchAll(): Promise<Array<ClubBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchForFront(id: number): Promise<ClubForFront | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do clube'));

		return await this.database.fetchForFront(id);
	}

	async fetchByName(name: string): Promise<Array<ClubBasicInfo>> {
		if (!name) throw Error(getErrorMessage('missingField', 'Nome do clube'));

		return await this.database.fetchByName(name);
	}

	async update(data: ClubUpdatePayload, id: number) {
		const toUpdate: ClubUpdate = {};

		if (data?.name) {
			const clubs: Array<ClubBasicInfo> = await this.fetchByName(data.name);

			if (clubs.length > 0 && clubs[0].id !== id) throw Error(getErrorMessage('clubAlreadyExist'));

			toUpdate.name = data.name;
		}
		
		if (data?.image) {
			toUpdate.image = data.image;
		}

		if (data?.symbol) {
			toUpdate.symbol = data.symbol;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}

	async remove(id: number): Promise<void> {
		await this.database.delete(id);
	}
}

export default ClubService; 