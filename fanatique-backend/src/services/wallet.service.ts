import {ethers} from 'ethers'; // Load Ethers library
import {wallet,provider} from '@/loaders/provider'
import jwt from 'jsonwebtoken';
import env from "@/config";
import UserService from './User.service';

const jwtSecret = env.JWT_SECRET || "seu_secret_padrao";
const JWT_EXPIRATION = env.JWT_EXPIRATION || '30d'; // Token expira em 30 dias por padrão
const userService = new UserService();

class walletService {

	async balanceOf() {
		const balance = await provider.getBalance(wallet.address)
		return ethers.formatEther(balance)
	}

	async signature(address: string, message: string, signature: string, name?: string) {
		try {
			// Verificar se os parâmetros necessários foram fornecidos
			if (!address || !message || !signature) {
				throw new Error('Endereço, mensagem e assinatura são obrigatórios');
			}

			// Validar o formato do endereço
			if (!ethers.isAddress(address)) {
				throw new Error('Endereço de carteira inválido');
			}

			// Recuperar o endereço que assinou a mensagem
			const recoveredAddress = ethers.verifyMessage(message, signature);

			
			
			// Verificar se o endereço recuperado coincide com o endereço fornecido
			const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
			
			if (!isValid) {
				return {
					success: false,
					message: 'Assinatura inválida',
					recoveredAddress
				};
			}
			
			// Verificar se o usuário já existe
			const userByWallet = await userService.fetchByEmail(address);

			console.log({userByWallet})
			
			let userId;
			
			if (!userByWallet) {
				// Se não existe usuário com este endereço de carteira e o nome foi fornecido,
				// cadastrar o usuário
				if (name) {
					try {
						userId = await userService.create({
							name,
							wallet_address: address
						});
					} catch (error) {
						return {
							success: false,
							message: error instanceof Error ? error.message : 'Erro ao cadastrar usuário',
						};
					}
				} else {
					// Usuário não encontrado e sem nome fornecido
					// Isso não é um erro interno, apenas indica que o registro é necessário
					return {
						success: false,
						message: 'Usuário não encontrado. É necessário fornecer um nome para cadastro',
						needsRegistration: true
					};
				}
			} else {
				userId = userByWallet.id;
			}

			console.log('DALE',{address})
			
			// Gerar um JWT para o usuário autenticado
			const token = this.generateJWT(address, userId);
			
			// Retornar o resultado da validação e o token
			return {
				success: true,
				message: 'Assinatura válida',
				recoveredAddress,
				token,
				userId
			};
		} catch (error) {
			// Capturar erros durante a validação
			console.error('Erro ao validar assinatura:', error);
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Erro desconhecido na validação da assinatura'
			};
		}
	}
	
	// Gerar um token JWT para o usuário 
	generateJWT(walletAddress: string, userId: number) {
		// Dados que serão armazenados no token JWT
		const payload = {
			address: walletAddress,
			user_id: userId,
			wallet: walletAddress,
		};
		
		// Gerar o token com expiração
		const signOptions = { expiresIn: JWT_EXPIRATION };
		return jwt.sign(payload, jwtSecret, signOptions as any);
	}

	// Verificar se um usuário já existe com este endereço de carteira
	async checkUserExists(address: string) {
		try {
			if (!ethers.isAddress(address)) {
				throw new Error('Endereço de carteira inválido');
			}
			
			const user = await userService.fetchByEmail(address);
			return {
				success: true,
				exists: !!user,
				user: user ? {
					id: user.id,
					name: user.name,
					wallet_address: user.wallet_address
				} : null
			};
		} catch (error) {
			console.error('Erro ao verificar usuário:', error);
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Erro ao verificar usuário'
			};
		}
	}
}

export default new walletService();
