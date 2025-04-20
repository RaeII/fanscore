/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { Product, ProductBasicInfo, ProductForFront, ProductInsert } from '../types';

class ProductDatabase extends Database {

	async create(data: ProductInsert) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO product SET ${mysqlBind};`, Object.values(data));
	}

	async fetchForFront(id: number): Promise<ProductForFront | null> {
		const rows: any = await this.query(`
			SELECT
				id,
				name,
				description,
				image,
				value_real,
				value_tokefan,
				establishment
			FROM product
			WHERE id = ?;`, [id]);

		return rows[0]?.length > 0 ? rows[0][0] as ProductForFront : null;
	}

	async fetch(id: number): Promise<Product | null> {
		const rows: any = await this.query('SELECT * FROM product WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as Product : null;
	}

	async fetchAll(): Promise<Array<ProductBasicInfo>> {
		const rows: any = await this.query('SELECT id, name, description, image, value_real, value_tokefan, establishment FROM product;', []);

		return rows[0];
	}

	async fetchByEstablishment(establishmentId: number): Promise<Array<ProductBasicInfo>> {
		const rows: any = await this.query('SELECT id, name, description, image, value_real, value_tokefan, establishment FROM product WHERE establishment = ?;', [establishmentId]);

		return rows[0];
	}

	async fetchByName(name: string): Promise<Array<ProductBasicInfo>> {
		const rows = await this.query('SELECT id, name, description, image, value_real, value_tokefan, establishment FROM product WHERE name = ?;', [name]);

		return rows[0] as Array<ProductBasicInfo>;
	}

	async update(data: any, id: number) {
		// Filtra valores undefined
		const filteredData = Object.fromEntries(
			Object.entries(data).filter(([_, value]) => value !== undefined)
		);
		
		const mysqlBind = createBindParams(filteredData);

		return await this.query(`UPDATE product SET ${mysqlBind}, update_date = now() WHERE id = ?;`, [...Object.values(filteredData), id]);
	}

	async delete(id: number) {
		return await this.query('DELETE FROM product WHERE id = ?;', [id]);
	}
}

export default ProductDatabase; 