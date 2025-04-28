import { ethers } from 'ethers';
import { getErrorMessage } from '@/helpers/response_collection';
import env from '@/config';
import { wallet } from '@/loaders/provider';
import ClubService from '@/services/Club.service';
import fantoken from 'artifacts/contracts/FanToken.sol/FanToken.json';
import fanatique from 'artifacts/contracts/Fanatique.sol/Fanatique.json';
import { ClubBasicInfo } from '@/types';

class ContractService {
	private clubService: ClubService;

	constructor() {
		this.clubService = new ClubService();
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
						const setTokenAcceptanceTx = await contractFanatique.setTokenAcceptance(clubId, true);
						await setTokenAcceptanceTx.wait();
						
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
					const createTokenTx = await contractFanToken.createToken(clubId, tokenName, tokenSymbol, initialSupply);
					await createTokenTx.wait();
					
					// 2. Verificar se o token foi criado corretamente
					const [name, symbol, totalSupply] = await contractFanToken.getTokenDetails(clubId);
					
					// 3. Configurar o token como método de pagamento aceito
					const setTokenAcceptanceTx = await contractFanatique.setTokenAcceptance(clubId, true);
					await setTokenAcceptanceTx.wait();
					
					results.push({
						clubId,
						name: club.name,
						tokenDetails: {
							name,
							symbol,
							totalSupply: totalSupply.toString()
						},
						tokenAccepted: true,
						status: 'created'
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
}

export default ContractService; 