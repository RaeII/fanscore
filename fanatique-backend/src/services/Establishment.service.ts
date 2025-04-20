import { getErrorMessage } from '@/helpers/response_collection';
import EstablishmentDatabase from '@/database/Establishment.database';
import { Establishment, EstablishmentBasicInfo, EstablishmentForFront, EstablishmentInsert, EstablishmentUpdatePayload, EstablishmentUpdate } from '../types';

class EstablishmentService {
	private database: EstablishmentDatabase;

	constructor() {
		this.database = new EstablishmentDatabase();
	}

	async create(data: EstablishmentInsert): Promise<number> {
		if (!data.name) throw Error(getErrorMessage('missingField', 'Nome do estabelecimento'));
		if (!data.segment) throw Error(getErrorMessage('missingField', 'Segmento do estabelecimento'));
		if (!data.image) throw Error(getErrorMessage('missingField', 'Imagem do estabelecimento'));

		const insertData: EstablishmentInsert = {
			name: data.name,
			segment: data.segment,
			image: data.image
		};

		const result: any = await this.database.create(insertData);
		return result[0].insertId;
	}

	async fetch(id: number): Promise<Establishment | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do estabelecimento'));

		return await this.database.fetch(id);
	}

	async fetchAll(): Promise<Array<EstablishmentBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchForFront(id: number): Promise<EstablishmentForFront | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do estabelecimento'));

		return await this.database.fetchForFront(id);
	}

	async fetchByName(name: string): Promise<Array<EstablishmentBasicInfo>> {
		if (!name) throw Error(getErrorMessage('missingField', 'Nome do estabelecimento'));

		return await this.database.fetchByName(name);
	}

	async update(data: EstablishmentUpdatePayload, id: number) {
		const toUpdate: EstablishmentUpdate = {};

		if (data?.name) {
			toUpdate.name = data.name;
		}
		
		if (data?.segment) {
			toUpdate.segment = data.segment;
		}
		
		if (data?.image) {
			toUpdate.image = data.image;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}

	async remove(id: number): Promise<void> {
		await this.database.delete(id);
	}
}

export default EstablishmentService; 