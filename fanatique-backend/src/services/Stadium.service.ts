import { getErrorMessage } from '@/helpers/response_collection';
import StadiumDatabase from '@/database/Stadium.database';
import ClubService from './Club.service';
import { Stadium, StadiumBasicInfo, StadiumForFront, StadiumInsert, StadiumUpdatePayload, StadiumUpdate } from '../types';

class StadiumService {
	private database: StadiumDatabase;
	private clubService: ClubService;

	constructor() {
		this.database = new StadiumDatabase();
		this.clubService = new ClubService();
	}

	async create(data: StadiumInsert): Promise<number> {
		if (!data.name) throw Error(getErrorMessage('missingField', 'Nome do estádio'));
		if (!data.image) throw Error(getErrorMessage('missingField', 'Imagem do estádio'));
		if (!data.city) throw Error(getErrorMessage('missingField', 'Cidade do estádio'));
		if (!data.state) throw Error(getErrorMessage('missingField', 'Estado do estádio'));
		if (!data.club_id) throw Error(getErrorMessage('missingField', 'Clube do estádio'));
		
		// Verifica se o clube existe
		const club = await this.clubService.fetch(data.club_id);
		if (!club) throw Error(getErrorMessage('registryNotFound', 'Clube'));
		
		// Verifica se o clube já possui um estádio
		const existingStadium = await this.fetchByClubId(data.club_id);
		if (existingStadium) throw Error(getErrorMessage('clubAlreadyHasStadium', 'Estádio'));

		const insertData: StadiumInsert = {
			name: data.name,
			image: data.image,
			city: data.city,
			state: data.state,
			club_id: data.club_id
		};

		const result: any = await this.database.create(insertData);
		return result[0].insertId;
	}

	async fetch(id: number): Promise<Stadium | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do estádio'));

		return await this.database.fetch(id);
	}

	async fetchAll(): Promise<Array<StadiumBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchForFront(id: number): Promise<StadiumForFront | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do estádio'));

		return await this.database.fetchForFront(id);
	}

	async fetchByName(name: string): Promise<Array<StadiumBasicInfo>> {
		if (!name) throw Error(getErrorMessage('missingField', 'Nome do estádio'));

		return await this.database.fetchByName(name);
	}

	async fetchByClubId(clubId: number): Promise<Stadium | null> {
		if (!clubId) throw Error(getErrorMessage('missingField', 'Id do clube'));

		return await this.database.fetchByClubId(clubId);
	}

	async update(data: StadiumUpdatePayload, id: number) {
		const toUpdate: StadiumUpdate = {};

		if (data?.name) {
			toUpdate.name = data.name;
		}
		
		if (data?.image) {
			toUpdate.image = data.image;
		}
		
		if (data?.city) {
			toUpdate.city = data.city;
		}
		
		if (data?.state) {
			toUpdate.state = data.state;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}

	async remove(id: number): Promise<void> {
		await this.database.delete(id);
	}
}

export default StadiumService; 