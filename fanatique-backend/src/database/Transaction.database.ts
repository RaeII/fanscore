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
        t.stable_id,
        t.date_register,
        c.name as club_name,
        c.image as club_image,
        c.symbol as club_symbol,
        s.name as stable_name,
        s.image as stable_image,
        s.symbol as stable_symbol
      FROM transaction t
      LEFT JOIN club c ON t.club_id = c.id
      LEFT JOIN stablecoin s ON t.stable_id = s.id
      WHERE t.user_id = ?
      ORDER BY t.date_register DESC;
    `, [userId]);

    return rows[0].map((row: any) => ({
      id: row.id,
      hash: row.hash,
      value: row.value,
      user_id: row.user_id,
      club_id: row.club_id,
      stable_id: row.stable_id,
      date_register: row.date_register,
      club: row.club_id ? {
        id: row.club_id,
        name: row.club_name,
        image: row.club_image,
        symbol: row.club_symbol
      } : undefined,
      stablecoin: row.stable_id ? {
        id: row.stable_id,
        name: row.stable_name,
        image: row.stable_image,
        symbol: row.stable_symbol
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
        t.club_id,
        t.stable_id,
        t.date_register,
        u.id as user_id,
        u.name as user_name,
        u.wallet_address as user_wallet_address,
        c.name as club_name,
        c.image as club_image,
        c.symbol as club_symbol,
        s.name as stable_name,
        s.image as stable_image,
        s.symbol as stable_symbol
      FROM transaction t
      LEFT JOIN user u ON t.user_id = u.id
      LEFT JOIN club c ON t.club_id = c.id
      LEFT JOIN stablecoin s ON t.stable_id = s.id
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
        } : undefined,
        club: transaction.club_id ? {
          id: transaction.club_id,
          name: transaction.club_name,
          image: transaction.club_image,
          symbol: transaction.club_symbol
        } : undefined,
        stablecoin: transaction.stable_id ? {
          id: transaction.stable_id,
          name: transaction.stable_name,
          image: transaction.stable_image,
          symbol: transaction.stable_symbol
        } : undefined
      };
      return result;
    }

    return null;
  }

  async fetchAll(): Promise<Array<TransactionBasicInfo>> {
    const rows: any = await this.query(`
      SELECT 
        t.id, 
        t.hash, 
        t.value, 
        t.user_id, 
        t.club_id,
        t.stable_id,
        t.date_register,
        c.name as club_name,
        c.image as club_image,
        c.symbol as club_symbol,
        s.name as stable_name,
        s.image as stable_image,
        s.symbol as stable_symbol
      FROM transaction t
      LEFT JOIN club c ON t.club_id = c.id
      LEFT JOIN stablecoin s ON t.stable_id = s.id
      ORDER BY t.date_register DESC;
    `, []);

    return rows[0].map((row: any) => ({
      id: row.id,
      hash: row.hash,
      value: row.value,
      user_id: row.user_id,
      club_id: row.club_id,
      stable_id: row.stable_id,
      club: row.club_id ? {
        id: row.club_id,
        name: row.club_name,
        image: row.club_image,
        symbol: row.club_symbol
      } : undefined,
      stablecoin: row.stable_id ? {
        id: row.stable_id,
        name: row.stable_name,
        image: row.stable_image,
        symbol: row.stable_symbol
      } : undefined
    }));
  }
}

export default TransactionDatabase; 