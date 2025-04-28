import api from '../lib/api';
/**
 * Transfere tokens para o usuário
 * @param {Object} data - Dados da transferência
 * @param {number} data.club_id - ID do clube
 * @param {string} data.to - Endereço da carteira do destinatário
 * @param {number} data.amount - Quantidade de tokens a serem transferidos
 * @returns {Promise<Object>} - Resposta da API
 */
export const transferTokens = async (data) => {
  try {
    const response = await api.post('/contract/transfer-tokens', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao transferir tokens:', error);
    throw error;
  }
};

/**
 * Busca os tokens disponíveis na carteira do usuário
 * @param {string} walletAddress - Endereço da carteira do usuário
 * @returns {Promise<Array>} - Lista de tokens com seus respectivos saldos
 */
export const getWalletTokens = async (walletAddress) => {
  try {
    const response = await api.get(`/contract/wallet-tokens/${walletAddress}`);
    return response.data.content;
  } catch (error) {
    console.error('Erro ao buscar tokens da carteira:', error);
    throw error;
  }
};

export default {
  transferTokens,
  getWalletTokens,
}; 