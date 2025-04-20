import { getErrorMessage } from '@/helpers/response_collection';
import ProductDatabase from '@/database/Product.database';
import EstablishmentService from './Establishment.service';
import { Product, ProductBasicInfo, ProductForFront, ProductInsert, ProductUpdatePayload, ProductUpdate } from '../types';

class ProductService {
	private database: ProductDatabase;
	private establishmentService: EstablishmentService;

	constructor() {
		this.database = new ProductDatabase();
		this.establishmentService = new EstablishmentService();
	}

	async create(data: ProductInsert): Promise<number> {

		if (!data.name) throw Error(getErrorMessage('missingField', 'Nome do produto'));
		if (!data.image) throw Error(getErrorMessage('missingField', 'Imagem do produto'));
		if (!data.value_real) throw Error(getErrorMessage('missingField', 'Valor em reais do produto'));
		if (!data.value_tokefan) throw Error(getErrorMessage('missingField', 'Valor em tokefan do produto'));
		if (!data.establishment) throw Error(getErrorMessage('missingField', 'Estabelecimento do produto'));

		const establishment = await this.establishmentService.fetch(data.establishment);
		if (!establishment) throw Error(getErrorMessage('registryNotFound', 'Estabelecimento'));

		const insertData: ProductInsert = {
			name: data.name,
			image: data.image,
			description: data.description,
			value_real: data.value_real,
			value_tokefan: data.value_tokefan,
			establishment: data.establishment
		};

		const result: any = await this.database.create(insertData);
		return result[0].insertId;
	}

	async fetch(id: number): Promise<Product | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do produto'));

		return await this.database.fetch(id);
	}

	async fetchAll(): Promise<Array<ProductBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchByEstablishment(establishmentId: number): Promise<Array<ProductBasicInfo>> {
		if (!establishmentId) throw Error(getErrorMessage('missingField', 'Id do estabelecimento'));

		return await this.database.fetchByEstablishment(establishmentId);
	}

	async fetchForFront(id: number): Promise<ProductForFront | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do produto'));

		return await this.database.fetchForFront(id);
	}

	async fetchByName(name: string): Promise<Array<ProductBasicInfo>> {
		if (!name) throw Error(getErrorMessage('missingField', 'Nome do produto'));

		return await this.database.fetchByName(name);
	}

	async update(data: ProductUpdatePayload, id: number) {
		const toUpdate: ProductUpdate = {};

		if (data?.name) {
			toUpdate.name = data.name;
		}
		
		if (data?.description !== undefined) {
			toUpdate.description = data.description;
		}

		if (data?.image) {
			toUpdate.image = data.image;
		}

		if (data?.value_real) {
			toUpdate.value_real = data.value_real;
		}
		
		if (data?.value_tokefan) {
			toUpdate.value_tokefan = data.value_tokefan;
		}
		
		if (data?.establishment) {
			// Verificar se o estabelecimento existe
			const establishment = await this.establishmentService.fetch(data.establishment);
			if (!establishment) throw Error(getErrorMessage('registryNotFound', 'Estabelecimento'));
			
			toUpdate.establishment = data.establishment;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}

	async remove(id: number): Promise<void> {
		await this.database.delete(id);
	}
}

export default ProductService; 