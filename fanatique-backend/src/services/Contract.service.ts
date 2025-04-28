import { ethers } from 'ethers';
import { getErrorMessage } from '@/helpers/response_collection';
import env from '@/config';
import { wallet } from '@/loaders/provider';
import ClubService from '@/services/Club.service';
import UserService from '@/services/User.service';
import TransactionService from '@/services/Transaction.service';
import UserClubTokenService from '@/services/UserClubToken.service';
import fantoken from 'artifacts/contracts/FanToken.sol/FanToken.json';
import fanatique from 'artifacts/contracts/Fanatique.sol/Fanatique.json';
import { ClubBasicInfo } from '@/types';
import { TransactionInsert } from '@/types/transaction';
import { TransferTokenPayload } from '@/types/transaction';

class ContractService {
	private clubService: ClubService;
	private userService: UserService;
	private transactionService: TransactionService;
	private userClubTokenService: UserClubTokenService;

	constructor() {
		this.clubService = new ClubService();
		this.userService = new UserService();
		this.transactionService = new TransactionService();
		this.userClubTokenService = new UserClubTokenService();
	}

	/**
	 * Retorna uma instância do contrato FanToken
	 * @returns Instância do contrato FanToken
	 */
	getFanTokenContract(): ethers.Contract {
		return new ethers.Contract(
			env.FANTOKEN_CONTRACT_ADDRESS,
			fantoken.abi,
			wallet
		);
	}

	/**
	 * Retorna uma instância do contrato Fanatique
	 * @returns Instância do contrato Fanatique
	 */
	getFanatiqueContract(): ethers.Contract {
		return new ethers.Contract(
			env.FANATIQUE_CONTRACT_ADDRESS,
			fanatique.abi,
			wallet
		);
	}

	/**
	 * Executa uma transação com retry automático em caso de erro de nonce
	 * @param contractFunction Função de contrato a ser executada com parâmetros
	 */
	private async executeWithRetry(contractFunction: Function, ...params: any[]): Promise<any> {
		const maxRetries = 5;
		let lastError = null;
		
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				// Executar a função do contrato
				const tx = await contractFunction(...params);
				
				// Usar o provider para aguardar a conclusão da transação
				const receipt = await wallet.provider?.waitForTransaction(tx.hash);
				return receipt;
			} catch (error: any) {
				lastError = error;
				
				// Verificar se é um erro de nonce
				if (error.message && error.message.includes('nonce has already been used')) {
					console.log(`Erro de nonce detectado. Tentativa ${attempt + 1}/${maxRetries + 1}`);
					
					// Aguardar antes de tentar novamente
					await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
					continue;
				}
				
				// Se não for erro de nonce, relançar
				throw error;
			}
		}
		
		// Se esgotou as tentativas
		throw lastError;
	}

	async configureAllClubTokens(initialSupply: string = "1000000000000000000000000"): Promise<Array<object>> {
		try {
			// Buscar todos os clubes cadastrados
			const clubs: Array<ClubBasicInfo> = await this.clubService.fetchAll();

			if (clubs.length === 0) {
				throw Error(getErrorMessage('registryNotFound', 'Clubes'));
			}

			// Instanciar os contratos usando os novos métodos
			const contractFanToken = this.getFanTokenContract();
			const contractFanatique = this.getFanatiqueContract();

			const results = [];

			// Para cada clube, criar um token e configurá-lo como método de pagamento
			for (const club of clubs) {
				try {
					const clubId = club.id;
					const tokenName = `${club.name} Fan Token`;
					const tokenSymbol = `${club.name.substring(0, 3).toUpperCase()}FT`;

					console.log(`Configurando token para clube ${clubId}: ${club.name}`);
					
					// Verificar se o token já existe
					try {
						const [existingName, existingSymbol, existingSupply] = await contractFanToken.getTokenDetails(clubId);
						console.log(`O token para o clube ${clubId} já existe: ${existingName} (${existingSymbol})`);
						
						// Certificar-se de que o token é aceito como pagamento
						const acceptanceReceipt = await this.executeWithRetry(
							contractFanatique.setTokenAcceptance.bind(contractFanatique),
							clubId,
							true
						);
						
						results.push({
							clubId,
							name: club.name,
							tokenDetails: {
								name: existingName,
								symbol: existingSymbol,
								totalSupply: existingSupply.toString()
							},
							tokenAccepted: true,
							status: 'already_exists'
						});
						
						continue; // Pula para o próximo clube
					} catch (error: any) {
						// Se chegou aqui, o token não existe e precisamos criá-lo
					}
					
					// 1. Criar token para o clube
					console.log(`Criando token para clube ${clubId}: ${tokenName} (${tokenSymbol})`);
					const createTokenReceipt = await this.executeWithRetry(
						contractFanToken.createToken.bind(contractFanToken),
						clubId,
						tokenName,
						tokenSymbol,
						initialSupply
					);
					
					console.log(`Token criado para o clube ${clubId}, hash: ${createTokenReceipt?.hash}`);
					
					// 2. Verificar se o token foi criado corretamente
					const [name, symbol, totalSupply] = await contractFanToken.getTokenDetails(clubId);
					
					// 3. Configurar o token como método de pagamento aceito
					const acceptanceReceipt = await this.executeWithRetry(
						contractFanatique.setTokenAcceptance.bind(contractFanatique),
						clubId,
						true
					);
					
					console.log(`Token configurado como pagamento para o clube ${clubId}, hash: ${acceptanceReceipt?.hash}`);
					
					results.push({
						clubId,
						name: club.name,
						tokenDetails: {
							name,
							symbol,
							totalSupply: totalSupply.toString()
						},
						tokenAccepted: true,
						status: 'created',
						txHash: createTokenReceipt?.hash
					});
				} catch (error: any) {
					console.error(`Erro ao configurar token para o clube ${club.id}:`, error);
					results.push({
						clubId: club.id,
						name: club.name,
						error: error.message,
						status: 'failed'
					});
				}
			}
			
			return results;
		} catch (error: any) {
			console.error(`Erro ao configurar tokens para os clubes:`, error);
			throw error;
		}
	}

	/**
	 * Transfere tokens de um clube para um usuário utilizando a função transferFromByOwner
	 * @param data Dados para transferência (club_id, to, amount)
	 * @param userId ID do usuário que receberá os tokens
	 * @returns Objeto com informações da transação
	 */
	async transferTokensToUser(data: TransferTokenPayload, userId: number): Promise<any> {
		try {
			if (!data.club_id) throw Error(getErrorMessage('missingField', 'ID do clube'));
			if (!data.to) throw Error(getErrorMessage('missingField', 'Endereço do destinatário'));
			if (!data.amount) throw Error(getErrorMessage('missingField', 'Quantidade de tokens'));

			// Verificar se o usuário existe
			const user = await this.userService.fetch(userId);
			if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuário'));

			// Verificar se o endereço fornecido corresponde ao da wallet do usuário
			/* if (user.wallet_address.toLowerCase() !== data.to.toLowerCase()) {
				throw Error('O endereço de destino não corresponde ao endereço da carteira do usuário');
			} */

			// Verificar se o clube existe
			const club = await this.clubService.fetch(data.club_id);
			if (!club) throw Error(getErrorMessage('registryNotFound', 'Clube'));

			// Verificar se o usuário já atingiu o limite de tokens para este clube
			const tokenCheck = await this.userClubTokenService.canReceiveTokens(
				userId, 
				data.club_id, 
				Number(data.amount)
			);

			if (!tokenCheck.canReceive) {
				throw Error(tokenCheck.reason);
			}

			console.log('data.club_id', data.club_id);

			// Obter instância do contrato FanToken
			const contractFanToken = this.getFanTokenContract();

			// Verificar se o token do clube existe
			try {
				await contractFanToken.getTokenDetails(data.club_id);
			} catch (error) {
				throw Error(`O token para o clube ID ${data.club_id} não existe`);
			}

			// Converter amount para BigNumber
			const amount = ethers.parseUnits(data.amount.toString(), 18); // Assumindo 18 decimais

			// Executar a transferência usando o método executeWithRetry para maior confiabilidade
			console.log(`Transferindo ${data.amount} tokens do clube ${data.club_id} para ${data.to}`);
			const receipt = await this.executeWithRetry(
				contractFanToken.transferFromByOwner.bind(contractFanToken),
				data.club_id,
				data.to,
				amount
			);
			
			// Registrar a transação no banco de dados
			const transactionData: TransactionInsert = {
				hash: receipt?.hash || '',
				value: parseInt(data.amount), // Convertendo para int para o banco
				user_id: userId,
				club_id: data.club_id
			};
			
			const transactionId = await this.transactionService.create(transactionData);
			
			// Registrar os tokens recebidos pelo usuário
			await this.userClubTokenService.registerTokens(
				userId, 
				data.club_id, 
				Number(data.amount)
			);
			
			return {
				transactionId,
				club_id: data.club_id,
				to: data.to,
				amount: data.amount,
				transactionHash: receipt?.hash,
				blockNumber: receipt?.blockNumber,
				status: 'success'
			};
		} catch (error: any) {
			console.error(`Erro ao transferir tokens:`, error);
			throw error;
		}
	}

	/**
	 * Retorna todos os FanTokens que uma carteira possui
	 * @param walletAddress Endereço da carteira do usuário
	 * @returns Array com informações de saldo de cada token do usuário
	 */
	async getWalletTokens(walletAddress: string): Promise<Array<any>> {
		try {
			if (!walletAddress) throw Error(getErrorMessage('missingField', 'Endereço da carteira'));

			// Obter instância do contrato FanToken
			const contractFanToken = this.getFanTokenContract();

			try {
				// Buscar os IDs de todos os tokens que a carteira possui
				const tokenIds = await contractFanToken.getHolderTokens(walletAddress);

				// Obter todos os clubes para exibir informações adicionais
				const clubs = await this.clubService.fetchAll();
				const clubsMap = new Map();
				clubs.forEach(club => {
					clubsMap.set(club.id.toString(), club);
				});

				// Array para armazenar os resultados
				const results = [];

				// Para cada token, buscar o saldo e detalhes
				for (const clubId of tokenIds) {
					try {
						// Obter o saldo do token para a carteira
						const balance = await contractFanToken.balanceOf(clubId, walletAddress);
						
						// Obter os detalhes do token
						const [name, symbol, totalSupply] = await contractFanToken.getTokenDetails(clubId);
						
						// Encontrar o clube correspondente
						const club = clubsMap.get(clubId.toString());
						
						// Adicionar ao resultado
						results.push({
							club_id: clubId.toString(),
							clubName: club ? club.name : null,
							tokenName: name,
							tokenSymbol: symbol,
							balance: ethers.formatUnits(balance, 18), // Converter de wei para unidade normal (assumindo 18 decimais)
						});
					} catch (error: any) {
						console.error(`Erro ao buscar detalhes do token ${clubId}:`, error);
						// Continue para o próximo token em caso de erro
					}
				}
				
				return results;
			} catch (error: any) {
				// Verificar se é um erro específico de "não tem tokens"
				if (error.message && error.message.includes("no tokens")) {
					// Se o usuário não tiver tokens, retornar array vazio
					return [];
				}
				throw error;
			}
		} catch (error: any) {
			console.error(`Erro ao buscar tokens da carteira:`, error);
			throw error;
		}
	}
}

export default ContractService; 