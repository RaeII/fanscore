import { getErrorMessage } from '@/helpers/response_collection';
import OrderDatabase from '@/database/Order.database';
import ProductOrderDatabase from '@/database/ProductOrder.database';
import EstablishmentService from './Establishment.service';
import MatchService from './Match.service';
import UserService from './User.service';
import ProductService from './Product.service';
import { Order, OrderBasicInfo, OrderForFront, OrderInsert, OrderUpdatePayload, OrderUpdate, ProductOrderInsert } from '../types';
import { provider,wallet } from '@/loaders/provider';
import ContractService from './Contract.service';
import { ethers } from 'ethers';

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
		if (!data.total_real) throw Error(getErrorMessage('missingField', 'Total em reais'));
		if (!data.total_fantoken) throw Error(getErrorMessage('missingField', 'Total em fantoken'));

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

	async paymentOrder(data: any): Promise<any> {

		// Validar os dados necessários
		if (!data.orderId) throw Error(getErrorMessage('missingField', 'ID do pedido'));
		if (!data.userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));
		if (!data.userAddress) throw Error(getErrorMessage('missingField', 'Endereço do usuário'));
		if (!data.clubId) throw Error(getErrorMessage('missingField', 'ID do clube'));
		if (!data.amount) throw Error(getErrorMessage('missingField', 'Valor do pagamento'));
		if (!data.signature) throw Error(getErrorMessage('missingField', 'Assinatura do pagamento'));
		if (!data.deadline) throw Error(getErrorMessage('missingField', 'Prazo limite para a meta-transação'));
		if (!data.v) throw Error(getErrorMessage('missingField', 'Componente v da assinatura do usuário para a meta-transação'));
		if (!data.r) throw Error(getErrorMessage('missingField', 'Componente r da assinatura do usuário para a meta-transação'));
		if (!data.s) throw Error(getErrorMessage('missingField', 'Componente s da assinatura do usuário para a meta-transação'));

		// Verificar se o pedido existe
		const order = await this.fetch(data.orderId);
		if (!order) throw Error(getErrorMessage('registryNotFound', 'Pedido'));

		console.log('Order:', order);
		console.log('User:', data.userId);

		// Verificar se o pedido pertence ao usuário
		if (order.user_id !== data.userId) {
			throw Error('Este pedido não pertence ao usuário autenticado');
		}

		// Verificar se o pedido está pendente de pagamento (status_id = 1)
		if (order.status_id !== 1) {
			throw Error('Este pedido não está em estado pendente de pagamento');
		}

		// Verificar se o valor do pagamento corresponde ao valor do pedido
		const orderAmountFantoken = parseFloat(order.total_fantoken.toString());
		const paymentAmount = parseFloat(data.amount.toString());
		
		if (Math.abs(orderAmountFantoken - paymentAmount) > 0.001) {
			throw Error('Valor do pagamento não corresponde ao valor do pedido');
		}

		try {
			// Aqui enviamos para o smart contract (simulado nesse exemplo)
			// Em produção, chamaríamos o método gaslessOrderPayment do contrato
			console.log('Processando pagamento blockchain com assinatura:', data.signature);

			// Processar o pagamento utilizando a assinatura EIP-712
			// Este é o ponto onde você integraria com seu contrato inteligente

			const contractService = new ContractService();
			const contractFanatique = contractService.getFanatiqueContract();
			
			console.log({
				orderId:data.orderId, 
				userAddress:data.userAddress, 
				clubId:data.clubId, 
				amount:order.total_fantoken.toString(), 
			});

			// Chamar a função gaslessOrderPayment do contrato
			const tx = await contractFanatique.gaslessOrderPayment(
				data.orderId,
				data.userAddress,
				Number(data.clubId),
				ethers.parseEther(order.total_fantoken.toString()),
				data.deadline,
				data.signature,
				data.v,
				data.r,
				data.s
			);

			// uint256 orderId,
			// address buyer,
			// uint256 clubId,
			// uint256 amount,
			// uint256 deadline,
			// bytes calldata orderSignature,
			// uint8 v, 
			// bytes32 r, 
			// bytes32 s

			// Aguardar a transação ser confirmada
			await tx.wait();
			
			// Atualizar o status do pedido para "pago" (status_id = 2)
			await this.database.update({ status_id: 2 }, data.orderId);

			// Registrar o pagamento no banco de dados
			await this.database.registerPayment({
				order_id: data.orderId,
				amount: data.amount,
				payment_type: 'fantoken',
				transaction_data: JSON.stringify(data.signature),
				club_id: data.clubId
			});


			return {
				success: true,
				order_id: data.orderId,
				new_status: 'Pago',
				status_id: 2
			};
		} catch (error) {
			console.error('Erro ao processar pagamento blockchain:', error);
			throw Error('Falha ao processar o pagamento na blockchain');
		}
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

	async fetchByMatch(matchId: number, userId: number): Promise<Array<OrderBasicInfo>> {
		if (!matchId) throw Error(getErrorMessage('missingField', 'Id do jogo'));

		return await this.database.fetchByMatch(matchId, userId);
	}

	async fetchByMatchWithProducts(matchId: number, userId: number): Promise<Array<any>> {
		if (!matchId) throw Error(getErrorMessage('missingField', 'Id do jogo'));

		// Buscar os pedidos da partida
		const orders = await this.database.fetchByMatch(matchId, userId);
		
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
		if (data?.status_id !== undefined) {
			// Verificar se o status existe
			const statusExists = await this.database.checkStatusExists(data.status_id);
			if (!statusExists) {
				throw Error('Status de pedido inválido');
			}
			
			toUpdate.status_id = data.status_id;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}
}

export default OrderService; 