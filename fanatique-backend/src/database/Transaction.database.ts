/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { Transaction, TransactionBasicInfo, TransactionForFront, TransactionInsert } from '../types/transaction';

class TransactionDatabase extends Database {

  async create(data: TransactionInsert) {
    const mysqlBind = createBindParams(data);

    return await this.query(`INSERT INTO transaction SET ${mysqlBind};`, Object.values(data));
  }

  async fetch(id: number): Promise<Transaction | null> {
    const rows: any = await this.query('SELECT * FROM transaction WHERE id = ?;', [id]);

    return rows[0]?.length > 0 ? rows[0][0] as Transaction : null;
  }

  async fetchByUser(userId: number): Promise<Array<TransactionBasicInfo>> {
    const rows: any = await this.query(`
      SELECT 
        t.id, 
        t.hash, 
        t.value, 
        t.user_id, 
        t.club_id,
        t.date_register,
        c.name as club_name,
        c.image as club_image,
        c.symbol
      FROM transaction t
      LEFT JOIN club c ON t.club_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.date_register DESC;
    `, [userId]);

    return rows[0].map((row: any) => ({
      id: row.id,
      hash: row.hash,
      value: row.value,
      user_id: row.user_id,
      club_id: row.club_id,
      date_register: row.date_register,
      club: row.club_id ? {
        id: row.club_id,
        name: row.club_name,
        image: row.club_image,
        symbol: row.symbol
      } : undefined
    }));
  }

  async fetchForFront(id: number): Promise<TransactionForFront | null> {
    const rows: any = await this.query(`
      SELECT 
        t.id,
        t.hash,
        t.value,
        t.user_id,
        t.date_register,
        u.id as user_id,
        u.name as user_name,
        u.wallet_address as user_wallet_address
      FROM transaction t
      LEFT JOIN user u ON t.user_id = u.id
      WHERE t.id = ?;
    `, [id]);

    if (rows[0]?.length > 0) {
      const transaction = rows[0][0] as any;
      const result: TransactionForFront = {
        id: transaction.id,
        hash: transaction.hash,
        value: transaction.value,
        user_id: transaction.user_id,
        date_register: transaction.date_register,
        user: transaction.user_id ? {
          id: transaction.user_id,
          name: transaction.user_name,
          wallet_address: transaction.user_wallet_address
        } : undefined
      };
      return result;
    }

    return null;
  }

  async fetchAll(): Promise<Array<TransactionBasicInfo>> {
    const rows: any = await this.query(`
      SELECT id, hash, value, user_id
      FROM transaction
      ORDER BY date_register DESC;
    `, []);

    return rows[0];
  }
}

export default TransactionDatabase; 