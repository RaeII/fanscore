import { getErrorMessage } from '@/helpers/response_collection';
import OrderDatabase from '@/database/Order.database';
import ProductOrderDatabase from '@/database/ProductOrder.database';
import EstablishmentService from './Establishment.service';
import MatchService from './Match.service';
import UserService from './User.service';
import ProductService from './Product.service';
import { Order, OrderBasicInfo, OrderForFront, OrderInsert, OrderUpdatePayload, OrderUpdate, ProductOrderInsert } from '../types';

class OrderService {
	private database: OrderDatabase;
	private productOrderDatabase: ProductOrderDatabase;
	private establishmentService: EstablishmentService;
	private matchService: MatchService;
	private userService: UserService;
	private productService: ProductService;

	constructor() {
		this.database = new OrderDatabase();
		this.productOrderDatabase = new ProductOrderDatabase();
		this.establishmentService = new EstablishmentService();
		this.matchService = new MatchService();
		this.userService = new UserService();
		this.productService = new ProductService();
	}

	async create(data: OrderInsert): Promise<number> {
		// Validações básicas
		if (!data.establishment_id) throw Error(getErrorMessage('missingField', 'Estabelecimento'));
		if (!data.user_id) throw Error(getErrorMessage('missingField', 'Usuário'));
		if (!data.match_id) throw Error(getErrorMessage('missingField', 'Jogo'));
		if (!data.products || data.products.length === 0) throw Error(getErrorMessage('missingField', 'Produtos do pedido'));
		
		// Verificar se o estabelecimento existe
		const establishment = await this.establishmentService.fetch(data.establishment_id);
		if (!establishment) throw Error(getErrorMessage('registryNotFound', 'Estabelecimento'));
		
		// Verificar se o jogo existe
		const match = await this.matchService.fetch(data.match_id);
		if (!match) throw Error(getErrorMessage('registryNotFound', 'Jogo'));
		
		// Verificar se o usuário existe
		const user = await this.userService.fetch(data.user_id);
		if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuário'));
		
		// Verificar se o status é válido
		if (data.status_id) {
			// Fazer uma consulta para verificar se o status existe
			const statusExists = await this.database.checkStatusExists(data.status_id);
			if (!statusExists) {
				throw Error('Status de pedido inválido');
			}
		}   
		
		// Verificar os produtos e calcular o total
		let calculatedTotalReal = 0;
        let calculatedTotalFantoken = 0;
		
		for (const productOrder of data.products) {
			// Verificar se o produto existe
			const productData = await this.productService.fetch(productOrder.product_id);
			if (!productData) throw Error(getErrorMessage('registryNotFound', `Produto ${productOrder.product_id}`));
			
			// Verificar se a quantidade é válida
			if (!productOrder.quantity || productOrder.quantity <= 0) {
				throw Error(`Quantidade inválida para o produto ${productData.name}`);
			}
			
			// Calcular subtotais
			calculatedTotalReal += parseFloat(productData.value_real) * productOrder.quantity;
            calculatedTotalFantoken += parseFloat(productData.value_tokefan) * productOrder.quantity;
		}
		
		// Validar o total calculado com o total informado (permitindo uma pequena margem de erro)
		if (Math.abs(calculatedTotalReal - data.total_real) > 0.01) {
			throw Error(`Total do pedido em reais incorreto. Calculado: ${calculatedTotalReal.toFixed(2)}, Informado: ${data.total_real.toFixed(2)}`);
		}

		// Validar o total calculado com o total informado (permitindo uma pequena margem de erro)
		if (Math.abs(calculatedTotalFantoken - data.total_fantoken) > 0.01) {
			throw Error(`Total do pedido em fantoken incorreto. Calculado: ${calculatedTotalFantoken.toFixed(2)}, Informado: ${data.total_fantoken.toFixed(2)}`);
		}
		
		// Criar o pedido
		const orderData = {
			establishment_id: data.establishment_id,
			user_id: data.user_id,
			match_id: data.match_id,
			status_id: data.status_id || 1, // Status padrão: Aguardando pagamento
			total_real: calculatedTotalReal, // Usar o valor calculado para garantir precisão
			total_fantoken: calculatedTotalFantoken // Usar o valor calculado para garantir precisão
		};
		
		const result: any = await this.database.create(orderData);
		const orderId = result[0].insertId;
		
		// Inserir os produtos do pedido
		await this.createProductOrders(orderId, data.products);
		
		return orderId;
	}

	private async createProductOrders(orderId: number, products: ProductOrderInsert[]): Promise<void> {
		for (const product of products) {
			await this.productOrderDatabase.create({
				order_id: orderId,
				product_id: product.product_id,
				quantity: product.quantity
			});
		}
	}

	async fetch(id: number): Promise<Order | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do pedido'));

		return await this.database.fetch(id);
	}

	async fetchAll(): Promise<Array<OrderBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchByUser(userId: number): Promise<Array<OrderBasicInfo>> {
		if (!userId) throw Error(getErrorMessage('missingField', 'Id do usuário'));

		return await this.database.fetchByUser(userId);
	}

	async fetchByEstablishment(establishmentId: number): Promise<Array<OrderBasicInfo>> {
		if (!establishmentId) throw Error(getErrorMessage('missingField', 'Id do estabelecimento'));

		return await this.database.fetchByEstablishment(establishmentId);
	}

	async fetchByMatch(matchId: number): Promise<Array<OrderBasicInfo>> {
		if (!matchId) throw Error(getErrorMessage('missingField', 'Id do jogo'));

		return await this.database.fetchByMatch(matchId);
	}

	async fetchByMatchWithProducts(matchId: number): Promise<Array<any>> {
		if (!matchId) throw Error(getErrorMessage('missingField', 'Id do jogo'));

		// Buscar os pedidos da partida
		const orders = await this.database.fetchByMatch(matchId);
		
		// Para cada pedido, buscar os produtos
		const ordersWithProducts = await Promise.all(orders.map(async (order) => {
			const products = await this.productOrderDatabase.fetchByOrderId(order.id);
			return {
				...order,
				products
			};
		}));
		
		return ordersWithProducts;
	}

	async fetchForFront(id: number): Promise<OrderForFront | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id do pedido'));

		const order = await this.database.fetchForFront(id);
		if (!order) return null;
		
		// Buscar os produtos do pedido
		const products = await this.productOrderDatabase.fetchByOrderId(id);
		order.products = products;
		
		return order;
	}

	async update(data: OrderUpdatePayload, id: number) {
		const toUpdate: OrderUpdate = {};
		
		// Apenas o status pode ser atualizado
		if (data?.status !== undefined) {
			// Verificar se o status existe
			const statusExists = await this.database.checkStatusExists(data.status);
			if (!statusExists) {
				throw Error('Status de pedido inválido');
			}
			
			toUpdate.status = data.status;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}
}

export default OrderService; 