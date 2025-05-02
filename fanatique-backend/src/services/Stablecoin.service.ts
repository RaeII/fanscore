import { getErrorMessage } from '@/helpers/response_collection';
import StablecoinDatabase from '@/database/Stablecoin.database';
import { Stablecoin } from '../types';

class StablecoinService {
    private database: StablecoinDatabase;

    constructor() {
        this.database = new StablecoinDatabase();
    }

    async fetch(id: number): Promise<Stablecoin | null> {
        if (!id) throw Error(getErrorMessage('missingField', 'Id da stablecoin'));

        return await this.database.fetch(id);
    }

    async fetchAll(): Promise<Array<Stablecoin>> {
        return await this.database.fetchAll();
    }
}

export default StablecoinService; 