import { getErrorMessage } from '@/helpers/response_collection';
import EstablishmentStadiumDatabase from '@/database/EstablishmentStadium.database';
import EstablishmentService from './Establishment.service';
import StadiumService from './Stadium.service';
import { EstablishmentStadium, EstablishmentStadiumBasicInfo, EstablishmentStadiumForFront, EstablishmentStadiumInsert, EstablishmentStadiumUpdate } from '../types';

class EstablishmentStadiumService {
	private database: EstablishmentStadiumDatabase;
	private establishmentService: EstablishmentService;
	private stadiumService: StadiumService;

	constructor() {
		this.database = new EstablishmentStadiumDatabase();
		this.establishmentService = new EstablishmentService();
		this.stadiumService = new StadiumService();
	}

	async create(data: EstablishmentStadiumInsert): Promise<number> {
		if (!data.establishment_id) throw Error(getErrorMessage('missingField', 'ID do estabelecimento'));
		if (!data.stadium_id) throw Error(getErrorMessage('missingField', 'ID do estádio'));

		// Verifica se o estabelecimento existe
		const establishment = await this.establishmentService.fetch(data.establishment_id);
		if (!establishment) throw Error(getErrorMessage('registryNotFound', 'Estabelecimento'));
		
		// Verifica se o estádio existe
		const stadium = await this.stadiumService.fetch(data.stadium_id);
		if (!stadium) throw Error(getErrorMessage('registryNotFound', 'Estádio'));
		
		// Verifica se já existe um vínculo entre este estádio e estabelecimento
		const existingLink = await this.database.fetchByStadiumAndEstablishment(data.stadium_id, data.establishment_id);
		if (existingLink) throw Error(getErrorMessage('establishmentAlreadyInStadium'));

		const insertData: EstablishmentStadiumInsert = {
			establishment_id: data.establishment_id,
			stadium_id: data.stadium_id
		};

		const result: any = await this.database.create(insertData);
		return result[0].insertId;
	}

	async fetch(id: number): Promise<EstablishmentStadium | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'ID do vínculo'));

		return await this.database.fetch(id);
	}

	async fetchAll(): Promise<Array<EstablishmentStadiumBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchByStadiumId(stadiumId: number): Promise<Array<EstablishmentStadiumBasicInfo>> {
		if (!stadiumId) throw Error(getErrorMessage('missingField', 'ID do estádio'));

		return await this.database.fetchByStadiumId(stadiumId);
	}
	
	async fetchByEstablishmentId(establishmentId: number): Promise<Array<EstablishmentStadiumBasicInfo>> {
		if (!establishmentId) throw Error(getErrorMessage('missingField', 'ID do estabelecimento'));

		return await this.database.fetchByEstablishmentId(establishmentId);
	}

	async update(data: EstablishmentStadiumUpdate, id: number) {
		const toUpdate: EstablishmentStadiumUpdate = {};

		if (data?.establishment_id) {
			// Verifica se o estabelecimento existe
			const establishment = await this.establishmentService.fetch(data.establishment_id);
			if (!establishment) throw Error(getErrorMessage('registryNotFound', 'Estabelecimento'));
			
			toUpdate.establishment_id = data.establishment_id;
		}
		
		if (data?.stadium_id) {
			// Verifica se o estádio existe
			const stadium = await this.stadiumService.fetch(data.stadium_id);
			if (!stadium) throw Error(getErrorMessage('registryNotFound', 'Estádio'));
			
			toUpdate.stadium_id = data.stadium_id;
		}

		if (data?.establishment_id && data?.stadium_id) {
			// Verifica se já existe um vínculo entre este estádio e estabelecimento
			const existingLink = await this.database.fetchByStadiumAndEstablishment(data.stadium_id, data.establishment_id);
			if (existingLink && existingLink.id !== id) throw Error(getErrorMessage('establishmentAlreadyInStadium'));
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}

	async remove(id: number): Promise<void> {
		await this.database.delete(id);
	}
}

export default EstablishmentStadiumService; 