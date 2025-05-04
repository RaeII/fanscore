import { getErrorMessage } from '@/helpers/response_collection';
import TransactionDatabase from '@/database/Transaction.database';
import UserService from '@/services/User.service';
import ClubService from '@/services/Club.service';
import StablecoinService from '@/services/Stablecoin.service';
import { Transaction, TransactionBasicInfo, TransactionForFront, TransactionInsert } from '../types/transaction';

class TransactionService {
  private database: TransactionDatabase;
  private userService: UserService;
  private clubService: ClubService;
  private stablecoinService: StablecoinService;

  constructor() {
    this.database = new TransactionDatabase();
    this.userService = new UserService();
    this.clubService = new ClubService();
    this.stablecoinService = new StablecoinService();
  }

  async create(data: TransactionInsert): Promise<number> {
    if (!data.hash) throw Error(getErrorMessage('missingField', 'Hash da transação'));
    if (!data.value) throw Error(getErrorMessage('missingField', 'Valor da transação'));
    if (!data.user_id) throw Error(getErrorMessage('missingField', 'ID do usuário'));
    
    // Verifica se pelo menos club_id ou stable_id está presente
    if (!data.club_id && !data.stable_id) {
      throw Error(getErrorMessage('missingField', 'ID do clube ou da stablecoin'));
    }

    // Verificar se o usuário existe
    const user = await this.userService.fetch(data.user_id);
    if (!user) throw Error(getErrorMessage('registryNotFound', 'Usuário'));

    // Verificar se o clube existe
    if (data.club_id) {
      const club = await this.clubService.fetch(data.club_id);
      if (!club) throw Error(getErrorMessage('registryNotFound', 'Clube'));
    }

    // Verificar se a stablecoin existe
    if (data.stable_id) {
      const stablecoin = await this.stablecoinService.fetch(data.stable_id);
      if (!stablecoin) throw Error(getErrorMessage('registryNotFound', 'Stablecoin'));
    }

    const result: any = await this.database.create(data);
    return result[0].insertId;
  }

  async fetch(id: number): Promise<Transaction | null> {
    if (!id) throw Error(getErrorMessage('missingField', 'Id da transação'));

    return await this.database.fetch(id);
  }

  async fetchForFront(id: number): Promise<TransactionForFront | null> {
    if (!id) throw Error(getErrorMessage('missingField', 'Id da transação'));

    return await this.database.fetchForFront(id);
  }

  async fetchByUser(userId: number): Promise<Array<TransactionBasicInfo>> {
    if (!userId) throw Error(getErrorMessage('missingField', 'Id do usuário'));

    return await this.database.fetchByUser(userId);
  }

  async fetchAll(): Promise<Array<TransactionBasicInfo>> {
    return await this.database.fetchAll();
  }
}

export default TransactionService; 