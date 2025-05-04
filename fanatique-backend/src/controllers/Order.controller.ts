import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import OrderService from '@/services/Order.service';
import Database from '@/database/Database';
import { Order, OrderForFront, OrderInsert, OrderUpdatePayload } from '@/types';

class OrderController extends Controller {
	private service: OrderService;

	constructor() {
		super();
		this.service = new OrderService();
	}

	async create(req: Request, res: Response) {
		
		try {	
			const userId: number = Number(res.locals.jwt.user_id);

			const body: OrderInsert = {
				establishment_id: req.body.establishment_id,
				user_id: userId,
				match_id: req.body.match_id,
				status_id: req.body.status_id || null,
				total_real: req.body.total_real,
				total_fantoken: req.body.total_fantoken,
				products: req.body.products || [],
			};

			await Database.startTransaction();
			const orderId = await this.service.create(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: { id: orderId }, 
				message: getSuccessMessage('create', 'Pedido') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			console.log(err);
			return await this.sendErrorMessage(res, err);
		}
	}

	async paymentOrder(req: Request, res: Response) {
		
		try {	
			const userId: number = Number(res.locals.jwt.user_id);
			const userAddress: string = res.locals.jwt.address;

			const body: any = {
				userId,
				orderId: req.body.order_id,
				amount: req.body.amount,
				signature: req.body.signature,
				userAddress: req.body.user_address,
				deadline: req.body.deadline,
				v: req.body.v,
				r: req.body.r,
				s: req.body.s,
				stablecoin_id: req.body.stablecoin_id
			};

			if (userAddress !== body.userAddress) {
				throw Error('Endereço de carteira não corresponde a carteira de login');
			}

			await Database.startTransaction();
			const result = await this.service.paymentOrder(body);
			await Database.commit();
			
			return this.sendSuccessResponse(res, { 
				content: result, 
				message: getSuccessMessage('pagamento concluido', 'Pedido') 
			});
		} catch (err) {
			await Database.rollback().catch(console.log);
			console.error('Erro no pagamento:', err);
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetch(req: Request, res: Response) {
		try {
			const orderId: number = Number(req.params.id);

			const order: OrderForFront | null = await this.service.fetchForFront(orderId);
			if (!order) throw Error(getErrorMessage('registryNotFound', 'Pedido'));

			return this.sendSuccessResponse(res, { content: order });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchAll(req: Request, res: Response) {
		try {
			const orders = await this.service.fetchAll();
			return this.sendSuccessResponse(res, { content: orders });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByUser(req: Request, res: Response) {
		try {
			const userId: number = Number(res.locals.jwt.user_id);

			console.log('\n\n',{userId},'\n\n');
			
			const orders = await this.service.fetchByUser(userId);
			return this.sendSuccessResponse(res, { content: orders });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByEstablishment(req: Request, res: Response) {
		try {
			const establishmentId: number = Number(req.params.establishmentId);
			
			const orders = await this.service.fetchByEstablishment(establishmentId);
			return this.sendSuccessResponse(res, { content: orders });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async fetchByMatch(req: Request, res: Response) {
		try {
			const matchId: number = Number(req.params.matchId);
			const userId: number = Number(res.locals.jwt.user_id);
			
			const orders = await this.service.fetchByMatchWithProducts(matchId, userId);
			return this.sendSuccessResponse(res, { content: orders });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const body: OrderUpdatePayload = {
				status_id: req.body.status_id
			};
			const orderId: number = Number(req.params.id);

			const order: Order | null = await this.service.fetch(orderId);

			if (!order) throw Error(getErrorMessage('registryNotFound', 'Pedido'));

			await this.service.update(body, orderId);
			return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Pedido') });
		} catch (err) {
			return await this.sendErrorMessage(res, err);
		}
	}
}

export default OrderController; 