/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { ProductOrder, ProductOrderBasicInfo, ProductOrderForFront } from '../types';

class ProductOrderDatabase extends Database {

	async create(data: any) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO product_order SET ${mysqlBind};`, Object.values(data));
	}

	async fetch(id: number): Promise<ProductOrder | null> {
		const rows: any = await this.query('SELECT * FROM product_order WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as ProductOrder : null;
	}

	async fetchByOrderId(orderId: number): Promise<Array<ProductOrderForFront>> {
		const rows: any = await this.query(`
			SELECT
				po.id,
				po.order_id,
				po.product_id,
				p.name as product_name,
				p.image as product_image,
				p.value_real,
				p.value_tokefan,
				po.quantity,
				(po.quantity * p.value_real) as subtotal_real,
				(po.quantity * p.value_tokefan) as subtotal_tokefan
			FROM product_order po
			JOIN product p ON po.product_id = p.id
			WHERE po.order_id = ?;`, [orderId]);

		return rows[0];
	}

	async update(data: any, id: number) {
		// Filtra valores undefined
		const filteredData = Object.fromEntries(
			Object.entries(data).filter(([_, value]) => value !== undefined)
		);
		
		const mysqlBind = createBindParams(filteredData);

		return await this.query(`UPDATE product_order SET ${mysqlBind} WHERE id = ?;`, [...Object.values(filteredData), id]);
	}

	async delete(id: number) {
		return await this.query('DELETE FROM product_order WHERE id = ?;', [id]);
	}

	async deleteByOrderId(orderId: number) {
		return await this.query('DELETE FROM product_order WHERE order_id = ?;', [orderId]);
	}
}

export default ProductOrderDatabase; 