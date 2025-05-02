/* eslint-disable @typescript-eslint/no-explicit-any */
import Database from './Database';
import { Stablecoin } from '../types';

class StablecoinDatabase extends Database {
    async fetch(id: number): Promise<Stablecoin | null> {
        const rows: any = await this.query('SELECT * FROM stablecoin WHERE id = ?;', [id]);

        return rows[0]?.length > 0 ? rows[0][0] as Stablecoin : null;
    }

    async fetchAll(): Promise<Array<Stablecoin>> {
        const rows: any = await this.query('SELECT * FROM stablecoin;', []);

        return rows[0];
    }
}

export default StablecoinDatabase; 