import { getErrorMessage } from '@/helpers/response_collection';
import UserClubTokenDatabase from '@/database/UserClubToken.database';
import ClubService from '@/services/Club.service';
import { UserClubToken, UserClubTokenBasicInfo, UserClubTokenInsert } from '../types';

class UserClubTokenService {
  private database: UserClubTokenDatabase;
  private clubService: ClubService;
  private TOKEN_LIMIT = 500;

  constructor() {
    this.database = new UserClubTokenDatabase();
    this.clubService = new ClubService();
  }

  /**
   * Registra ou atualiza os tokens recebidos por um usuário de um determinado clube
   * @param userId ID do usuário
   * @param clubId ID do clube
   * @param amount Quantidade de tokens a ser adicionada
   * @returns Objeto com informações do registro atualizado
   */
  async registerTokens(userId: number, clubId: number, amount: number): Promise<any> {
    if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));
    if (!clubId) throw Error(getErrorMessage('missingField', 'ID do clube'));
    if (!amount) throw Error(getErrorMessage('missingField', 'Quantidade de tokens'));

    // Verificar se o clube existe
    const club = await this.clubService.fetch(clubId);
    if (!club) throw Error(getErrorMessage('registryNotFound', 'Clube'));

    // Verificar se já existe um registro para este usuário e clube
    const existingRecord = await this.database.fetchByUserAndClub(userId, clubId);

    // Calcular o novo total
    const newTotal = existingRecord ? existingRecord.total + amount : amount;

    // Verificar se o limite foi excedido
    if (newTotal > this.TOKEN_LIMIT) {
      throw Error(`Número de tokens limites "${club.name}" de teste excedeu`);
    }

    // Atualizar ou criar um novo registro
    if (existingRecord) {
      await this.database.update(userId, clubId, newTotal);
      return {
        user_id: userId,
        club_id: clubId,
        total: newTotal,
        previous_total: existingRecord.total,
        added: amount
      };
    } else {
      const data: UserClubTokenInsert = {
        user_id: userId,
        club_id: clubId,
        total: amount
      };
      const result = await this.database.create(data);
      return {
        id: result[0].insertId,
        user_id: userId,
        club_id: clubId,
        total: amount,
        added: amount
      };
    }
  }

  /**
   * Retorna todos os registros de tokens de clubes para um usuário
   * @param userId ID do usuário
   * @returns Array com todos os registros de tokens do usuário
   */
  async fetchAllByUser(userId: number): Promise<Array<UserClubTokenBasicInfo>> {
    if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));
    return await this.database.fetchAllByUser(userId);
  }

  /**
   * Retorna um registro específico de tokens para um usuário e clube
   * @param userId ID do usuário
   * @param clubId ID do clube
   * @returns Registro de tokens ou null
   */
  async fetchByUserAndClub(userId: number, clubId: number): Promise<UserClubToken | null> {
    if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));
    if (!clubId) throw Error(getErrorMessage('missingField', 'ID do clube'));
    return await this.database.fetchByUserAndClub(userId, clubId);
  }

  /**
   * Verifica se um usuário pode receber uma determinada quantidade de tokens
   * @param userId ID do usuário
   * @param clubId ID do clube
   * @param amount Quantidade que deseja receber
   * @returns Objeto com informações da verificação
   */
  async canReceiveTokens(userId: number, clubId: number, amount: number): Promise<{ canReceive: boolean, reason?: string, available?: number }> {
    if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));
    if (!clubId) throw Error(getErrorMessage('missingField', 'ID do clube'));
    if (!amount) throw Error(getErrorMessage('missingField', 'Quantidade de tokens'));

    // Verificar se o clube existe
    const club = await this.clubService.fetch(clubId);
    if (!club) throw Error(getErrorMessage('registryNotFound', 'Clube'));

    // Verificar se já existe um registro para este usuário e clube
    const existingRecord = await this.database.fetchByUserAndClub(userId, clubId);
    const currentTotal = existingRecord ? existingRecord.total : 0;
    const newTotal = currentTotal + amount;

    if (newTotal > this.TOKEN_LIMIT) {
      const available = this.TOKEN_LIMIT - currentTotal;
      return {
        canReceive: false,
        reason: `Limite de tokens de teste (${this.TOKEN_LIMIT}) para o clube "${club.name}" seria excedido`,
        available: available > 0 ? available : 0
      };
    }

    return {
      canReceive: true,
      available: this.TOKEN_LIMIT - currentTotal
    };
  }
}

export default UserClubTokenService; 