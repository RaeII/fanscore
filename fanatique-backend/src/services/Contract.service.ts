import { ethers } from 'ethers';
import { getErrorMessage } from '@/helpers/response_collection';
import env from '@/config';
import { wallet } from '@/loaders/provider';
import ClubService from '@/services/Club.service';
import UserService from '@/services/User.service';
import TransactionService from '@/services/Transaction.service';
import UserClubTokenService from '@/services/UserClubToken.service';
import StablecoinService from '@/services/Stablecoin.service';
import fantoken from 'artifacts/contracts/FanToken.sol/FanToken.json';
import fanatique from 'artifacts/contracts/Fanatique.sol/Fanatique.json';
import erc20 from 'artifacts/contracts/ERC20/USDC.sol/USDC.json';
import { ClubBasicInfo } from '@/types';
import { TransactionInsert } from '@/types/transaction';
import { TransferTokenPayload, TransferStablecoinPayload } from '@/types/transaction';
import { exec } from 'child_process';
import { promisify } from 'util';
import { erc20 as erc20Type } from 'typechain-types/contracts';

const execPromise = promisify(exec);

class ContractService {
	private clubService: ClubService;
	private userService: UserService;
	private transactionService: TransactionService;
	private userClubTokenService: UserClubTokenService;
	private stablecoinService: StablecoinService;

	constructor() {
		this.clubService = new ClubService();
		this.userService = new UserService();
		this.transactionService = new TransactionService();
		this.userClubTokenService = new UserClubTokenService();
		this.stablecoinService = new StablecoinService();
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

	erc20Contract(address: string): ethers.Contract {
		return new ethers.Contract(
			address,
			erc20.abi,
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
			// Executar os comandos de deploy dos contratos
/* 			console.log('Iniciando deploy do contrato FanToken...');
			try {
				const { stdout: fanTokenOutput, stderr: fanTokenError } = await execPromise('export NODE_ENV=development && npx hardhat deploy --network localhost --contract fantoken');
				console.log('FanToken deploy output:', fanTokenOutput);
				if (fanTokenError) console.error('FanToken deploy error:', fanTokenError);
			} catch (error: any) {
				console.error('Erro ao executar deploy do FanToken:', error.message);
				throw new Error(`Falha ao fazer deploy do contrato FanToken: ${error.message}`);
			}

			console.log('Iniciando deploy do contrato Fanatique...');
			try {
				const { stdout: fanatiqueOutput, stderr: fanatiqueError } = await execPromise('export NODE_ENV=development && npx hardhat deploy --network localhost --contract fanatique');
				console.log('Fanatique deploy output:', fanatiqueOutput);
				if (fanatiqueError) console.error('Fanatique deploy error:', fanatiqueError);
			} catch (error: any) {
				console.error('Erro ao executar deploy do Fanatique:', error.message);
				throw new Error(`Falha ao fazer deploy do contrato Fanatique: ${error.message}`);
			}

			console.log('Iniciando deploy dos contratos ERC20...');
			try {
				const { stdout: erc20Output, stderr: erc20Error } = await execPromise('export NODE_ENV=development && npx hardhat deploy --network localhost --contract erc20');
				console.log('ERC20 deploy output:', erc20Output);
				if (erc20Error) console.error('ERC20 deploy error:', erc20Error);
			} catch (error: any) {
				console.error('Erro ao executar deploy dos contratos ERC20:', error.message);
				throw new Error(`Falha ao fazer deploy dos contratos ERC20: ${error.message}`);
			} */

			await this.configureAllStablecoins();

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
					const tokenName = club.name;
					const tokenSymbol = club.symbol;

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
					
					results.push({
						clubId,
						name: club.name,
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

	async configureAllStablecoins() {
		const stablecoins = await this.stablecoinService.fetchAll();

		if (stablecoins.length === 0) {
			throw Error(getErrorMessage('registryNotFound', 'Stablecoins'));
		}

		for (const stablecoin of stablecoins) {
			const contract = this.getFanatiqueContract();

			console.log("stablecoin", stablecoin.id, stablecoin.address);

			const acceptanceReceipt = await this.executeWithRetry(
				contract.setAcceptedToken.bind(contract),
				stablecoin.id,
				stablecoin.address,
				true,
				true
			);
			
		}

		return true;
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

	/**
	 * Retorna os detalhes e saldo de um FanToken específico que uma carteira possui
	 * @param walletAddress Endereço da carteira do usuário
	 * @param clubId ID do clube do token
	 * @returns Objeto com informações de saldo e detalhes do token
	 */
	async getWalletTokenByClub(walletAddress: string, clubId: number): Promise<any> {
		try {
			if (!walletAddress) throw Error(getErrorMessage('missingField', 'Endereço da carteira'));
			if (!clubId) throw Error(getErrorMessage('missingField', 'ID do clube'));

			// Obter instância do contrato FanToken
			const contractFanToken = this.getFanTokenContract();

			// Verificar se o clube existe
			const club = await this.clubService.fetch(clubId);
			if (!club) throw Error(getErrorMessage('registryNotFound', 'Clube'));

			try {
				// Obter o saldo do token para a carteira
				const balance = await contractFanToken.balanceOf(clubId, walletAddress);
				
				// Obter os detalhes do token
				const [name, symbol, totalSupply] = await contractFanToken.getTokenDetails(clubId);
				
				// Retornar as informações
				return {
					club_id: clubId.toString(),
					clubName: club.name,
					clubSymbol: club.symbol,
					clubImage: club.image,
					tokenName: name,
					tokenSymbol: symbol,
					balance: ethers.formatUnits(balance, 18), // Converter de wei para unidade normal (assumindo 18 decimais)
				};
			} catch (error: any) {
				// Se o usuário não tiver o token do clube, retornar saldo zero
				if (error.message && (error.message.includes("no tokens") || error.message.includes("token does not exist"))) {
					return {
						club_id: clubId.toString(),
						clubName: club.name,
						clubSymbol: club.symbol,
						clubImage: club.image,
						tokenName: club.name,
						tokenSymbol: club.symbol,
						balance: "0"
					};
				}
				throw error;
			}
		} catch (error: any) {
			console.error(`Erro ao buscar token do clube ${clubId}:`, error);
			throw error;
		}
	}

	/**
	 * Obtém o saldo de todas as stablecoins registradas para um endereço específico
	 * @param walletAddress Endereço da carteira a ser consultada
	 * @returns Array com informações de saldo de cada stablecoin
	 */
	async getStablecoinBalances(walletAddress: string): Promise<Array<any>> {
		
			if (!walletAddress) throw Error(getErrorMessage('missingField', 'Endereço da carteira'));

			// Buscar todas as stablecoins registradas no sistema
			const stablecoins = await this.stablecoinService.fetchAll();
			
			if (stablecoins.length === 0) {
				return [];
			}

			const balances = [];

			// Para cada stablecoin, buscar o saldo do endereço
			for (const coin of stablecoins) {
				try {
					// Obter uma instância do contrato da stablecoin
					const coinContract = this.erc20Contract(coin.address);
					
					// Obter o saldo da stablecoin
					const balance = await coinContract.balanceOf(walletAddress);
					
					// Obter a quantidade de decimais da stablecoin
					const decimals = await coinContract.decimals();

					// Adicionar ao resultado
					balances.push({
						id: coin.id,
						name: coin.name,
						symbol: coin.symbol,
						address: coin.address,
						balance: ethers.formatUnits(balance.toString(), decimals),
						raw_balance: balance.toString(),
						image: coin.image
					});


				} catch (error: any) {
					console.error(`Erro ao buscar saldo da stablecoin ${coin.name}:`, error);
					// Adicionar com erro, mas continuar para as próximas
					balances.push({
						id: coin.id,
						name: coin.name,
						symbol: coin.symbol,
						address: coin.address,
						error: error.message
					});
				}
			}			
			return balances;

	}

	/**
	 * Obtém o saldo de uma stablecoin específica para um endereço
	 * @param walletAddress Endereço da carteira a ser consultada
	 * @param stablecoinId ID da stablecoin específica
	 * @returns Objeto com informações de saldo da stablecoin
	 */
	async getStablecoinBalance(walletAddress: string, stablecoinId: number): Promise<any> {
		try {
			if (!walletAddress) throw Error(getErrorMessage('missingField', 'Endereço da carteira'));
			if (!stablecoinId) throw Error(getErrorMessage('missingField', 'ID da stablecoin'));

			// Buscar a stablecoin pelo ID
			const stablecoin = await this.stablecoinService.fetch(stablecoinId);
			
			if (!stablecoin) {
				throw Error(getErrorMessage('registryNotFound', 'Stablecoin'));
			}

			// Obter uma instância do contrato da stablecoin
			const coinContract = this.erc20Contract(stablecoin.address);
			
			// Obter o saldo da stablecoin
			const balance = await coinContract.balanceOf(walletAddress);
			
			// Obter a quantidade de decimais da stablecoin
			const decimals = await coinContract.decimals();

			// Retornar as informações da stablecoin e seu saldo
			return {
				id: stablecoin.id,
				name: stablecoin.name,
				symbol: stablecoin.symbol,
				address: stablecoin.address,
				balance: ethers.formatUnits(balance.toString(), decimals),
				raw_balance: balance.toString(),
				image: stablecoin.image
			};
		} catch (error: any) {
			console.error(`Erro ao buscar saldo da stablecoin ${stablecoinId}:`, error);
			throw error;
		}
	}

	/**
	 * Realiza um pagamento usando uma stablecoin específica
	 * @param fromAddress Endereço que fará o pagamento
	 * @param toAddress Endereço que receberá o pagamento
	 * @param stablecoinId ID da stablecoin a ser utilizada
	 * @param amount Valor a ser transferido (em formato string com decimais)
	 * @returns Objeto com informações da transação
	 */
	async payWithStablecoin(fromAddress: string, toAddress: string, stablecoinId: number, amount: string): Promise<any> {
		try {
			if (!fromAddress) throw Error(getErrorMessage('missingField', 'Endereço de origem'));
			if (!toAddress) throw Error(getErrorMessage('missingField', 'Endereço de destino'));
			if (!stablecoinId) throw Error(getErrorMessage('missingField', 'ID da stablecoin'));
			if (!amount) throw Error(getErrorMessage('missingField', 'Valor a transferir'));

			// Buscar a stablecoin no banco de dados
			const stablecoin = await this.stablecoinService.fetch(stablecoinId);
			if (!stablecoin) {
				throw Error(getErrorMessage('registryNotFound', 'Stablecoin'));
			}

			// Obter uma instância do contrato da stablecoin
			const coinContract = this.erc20Contract(stablecoin.address);
			
			// Obter a quantidade de decimais da stablecoin
			const decimals = await coinContract.decimals();

			// Converter o valor para a unidade adequada considerando os decimais
			const valueToSend = ethers.parseUnits(amount, decimals);

			// Verificar se o usuário tem saldo suficiente
			const balance = await coinContract.balanceOf(fromAddress);
			if (balance.lt(valueToSend)) {
				throw Error('Saldo insuficiente para realizar a transferência');
			}

			// Executar a transferência chamando o método transferFrom no contrato
			// Nota: Isso requer que o contrato tenha aprovação (allowance) para transferir tokens do fromAddress
			const receipt = await this.executeWithRetry(
				coinContract.transferFrom.bind(coinContract),
				fromAddress,
				toAddress,
				valueToSend
			);

			// Registrar a transação no banco de dados
			const transactionData: TransactionInsert = {
				hash: receipt?.hash || '',
				value: parseFloat(amount), // Valor usado para o banco
				user_id: 0, // Precisaria buscar o ID do usuário com base no endereço
				stable_id: stablecoinId
				// Outros dados poderiam ser adicionados conforme necessário
			};
			
			const transactionId = await this.transactionService.create(transactionData);
			
			return {
				transactionId,
				from: fromAddress,
				to: toAddress,
				amount: amount,
				stablecoin: {
					id: stablecoin.id,
					name: stablecoin.name,
					symbol: stablecoin.symbol
				},
				transactionHash: receipt?.hash,
				blockNumber: receipt?.blockNumber,
				status: 'success'
			};
		} catch (error: any) {
			console.error(`Erro ao realizar pagamento com stablecoin:`, error);
			throw error;
		}
	}

	/**
	 * Transfere stablecoins para um usuário
	 * @param data Dados para transferência (stablecoin_id, to, amount)
	 * @param userId ID do usuário que receberá as stablecoins
	 * @returns Objeto com informações da transação
	 */
	async transferStablecoinsToUser(data: TransferStablecoinPayload, userId: number): Promise<any> {
		try {
			if (!data.stablecoin_id) throw Error(getErrorMessage('missingField', 'ID da stablecoin'));
			if (!data.to) throw Error(getErrorMessage('missingField', 'Endereço do destinatário'));
			if (!data.amount) throw Error(getErrorMessage('missingField', 'Quantidade de tokens'));

			// Verificar se o usuário existe
			const user = await this.userService.fetch(userId);
			if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuário'));

			// Verificar se a stablecoin existe
			const stablecoin = await this.stablecoinService.fetch(data.stablecoin_id);
			if (!stablecoin) throw Error(getErrorMessage('registryNotFound', 'Stablecoin'));

			// Obter instância do contrato da stablecoin
			const stableContract = this.erc20Contract(stablecoin.address);

			// Verificar se a stablecoin existe no contrato
			try {
				// Obter a quantidade de decimais da stablecoin
				const decimals = await stableContract.decimals();
				
				// Converter amount para BigNumber
				const amount = ethers.parseUnits(data.amount, decimals);

				// Verificar se o contrato possui saldo suficiente 
				const contractBalance = await stableContract.balanceOf(wallet.address);
				
				console.log('contractBalance', contractBalance);

				// Executar a transferência
				console.log(`Transferindo ${data.amount} ${stablecoin.symbol} para ${data.to}`);
				const receipt = await this.executeWithRetry(
					stableContract.transfer.bind(stableContract),
					data.to,
					amount
				);
				
				// Registrar a transação no banco de dados
				const transactionData: TransactionInsert = {
					hash: receipt?.hash || '',
					value: parseFloat(data.amount), // Convertendo para float para o banco
					user_id: userId,
					stable_id: data.stablecoin_id
				};
				
				const transactionId = await this.transactionService.create(transactionData);
				
				return {
					transactionId,
					stablecoin_id: data.stablecoin_id,
					stablecoin: {
						name: stablecoin.name,
						symbol: stablecoin.symbol
					},
					to: data.to,
					amount: data.amount,
					transactionHash: receipt?.hash,
					blockNumber: receipt?.blockNumber,
					status: 'success'
				};
			} catch (error: any) {
				console.error(`Erro ao transferir stablecoins:`, error);
				throw error;
			}
		} catch (error: any) {
			console.error(`Erro ao transferir stablecoins:`, error);
			throw error;
		}
	}
}

export default ContractService; 