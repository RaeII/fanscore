import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import ProductService from '@/services/Product.service';
import Database from '@/database/Database';
import { Product, ProductForFront, ProductInsert, ProductUpdatePayload } from '@/types';

class ProductController extends Controller {
	private service: ProductService;

	constructor() {
		super();
		this.service = new ProductService();
	}

	async create(req: Request, res: Response) {
		try {
			const body: ProductInsert = {
				name: req.body.name,
				image: req.body.image,
				description: req.body?.description || '',
				value_real: req.body.value_real,
				value_tokefan: req.body.value_tokefan,
				establishment: req.body.establishment
			};

			await Database.startTransaction();
			const productId = await this.service.create(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: { id: productId }, 
				message: getSuccessMessage('create', 'Produto') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			console.log(err);
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const productId: number = Number(req.params.id);

			const product: ProductForFront | null = await this.service.fetchForFront(productId);
			if (!product) throw Error(getErrorMessage('registryNotFound', 'Produto'));

			return this.sendSuccessResponse(res, { content: product });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const products = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: products });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByEstablishment(req: Request, res: Response) {
		try {
			const establishmentId: number = Number(req.params.establishmentId);
			
			const products = await this.service.fetchByEstablishment(establishmentId);
			return this.sendSuccessResponse(res, { content: products });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: ProductUpdatePayload = {
				name: req.body.name,
				image: req.body.image,
				description: req.body.description,
				value_real: req.body.value_real,
				value_tokefan: req.body.value_tokefan,
				establishment: req.body.establishment
			};
			const productId: number = Number(req.params.id);

			const product: Product | null = await this.service.fetch(productId);

			if (!product) throw Error(getErrorMessage('registryNotFound', 'Produto'));

			await this.service.update(body, productId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Produto') });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const productId: number = Number(req.params.id);
			
			const product: Product | null = await this.service.fetch(productId);
			if (!product) throw Error(getErrorMessage('registryNotFound', 'Produto'));
			
			Database.startTransaction();
			await this.service.remove(productId);
			Database.commit();
			return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'Produto') });
		} catch (err) {
			Database.rollback();
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default ProductController; 