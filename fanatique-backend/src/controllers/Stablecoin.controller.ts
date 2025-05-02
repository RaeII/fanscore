import { Request, Response } from 'express';

import { getErrorMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import StablecoinService from '@/services/Stablecoin.service';
import { Stablecoin } from '../types';

class StablecoinController extends Controller {
    private service: StablecoinService;

    constructor() {
        super();
        this.service = new StablecoinService();
    }

    async fetch(req: Request, res: Response) {
        try {
            const stablecoinId: number = Number(req.params.id);

            const stablecoin: Stablecoin | null = await this.service.fetch(stablecoinId);
            if (!stablecoin) throw Error(getErrorMessage('registryNotFound', 'Stablecoin'));

            return this.sendSuccessResponse(res, { content: { ...stablecoin } });
        } catch (err) {
            this.sendErrorMessage(res, err, 'Erro ao buscar stablecoin');
        }
    }

    async fetchAll(req: Request, res: Response) {
        try {
            const stablecoins = await this.service.fetchAll();
            return this.sendSuccessResponse(res, { content: stablecoins });
        } catch (err) {
            this.sendErrorMessage(res, err, 'Erro ao buscar todas stablecoins');
        }
    }
}

export default StablecoinController; 