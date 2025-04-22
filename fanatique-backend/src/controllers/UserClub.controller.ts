import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import UserClubService from '@/services/UserClub.service';
import Database from '@/database/Database';
import { UserClub, UserClubInsert, UserClubUpdate } from '@/types';

class UserClubController extends Controller {
    private service: UserClubService;

    constructor() {
        super();
        this.service = new UserClubService();
    }

    async create(req: Request, res: Response) {
        try {
            const userId: number = Number(res.locals.jwt.user_id);
            const body: UserClubInsert = {
                user_id: userId,
                club_id: req.body.club_id,
                club_type_id: req.body.club_type_id
            };

            if (!body.club_id) throw Error(getErrorMessage('missingField', 'ID do clube'));
            if (!body.club_type_id) throw Error(getErrorMessage('missingField', 'Tipo de clube'));

            await Database.startTransaction();
            await this.service.create(body);
            await Database.commit();
            
            return this.sendSuccessResponse(res, { message: getSuccessMessage('create', 'Clube do usuário') });
        } catch (err) {
            await Database.rollback().catch(console.log);
            return await this.sendErrorMessage(res, err);
        }
    }

    async fetch(req: Request, res: Response) {
        try {
            const userId: number = Number(res.locals.jwt.user_id);

            const userClubs = await this.service.fetchByUserId(userId);
            
            return this.sendSuccessResponse(res, { content: userClubs });
        } catch (err) {
            return await this.sendErrorMessage(res, err);
        }
    }

    async fetchAll(req: Request, res: Response) {
        try {
            const userId: number = Number(res.locals.jwt.user_id);

            const userClubs = await this.service.fetchAllByUserId(userId);
            return this.sendSuccessResponse(res, { content: userClubs });
        } catch (err) {
           return await this.sendErrorMessage(res, err);
        }
    }

    async update(req: Request, res: Response) {
        try {
            const userId: number = Number(res.locals.jwt.user_id);
            const body: UserClubUpdate = {
                club_id: req.body.club_id,
                club_type_id: req.body.club_type_id
            };

            if (!body.club_id) throw Error(getErrorMessage('missingField', 'ID do clube'));
            if (!body.club_type_id) throw Error(getErrorMessage('missingField', 'Tipo de clube'));

            await Database.startTransaction();
            await this.service.update(body, req.body.id, userId);
            await Database.commit();
            
            return this.sendSuccessResponse(res, { message: getSuccessMessage('update', 'Clube do usuário') });
        } catch (err) {
            await Database.rollback().catch(console.log);
            return await this.sendErrorMessage(res, err);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const userId: number = Number(res.locals.jwt.user_id);
            const clubId: number = Number(req.params.id);

            if (!clubId) throw Error(getErrorMessage('missingField', 'ID do clube'));

            await Database.startTransaction();
            await this.service.remove(clubId, userId);
            await Database.commit();
            
            return this.sendSuccessResponse(res, { message: getSuccessMessage('delete', 'Clube do usuário') });
        } catch (err) {
            await Database.rollback().catch(console.log);
            return await this.sendErrorMessage(res, err);
        }
    }
}

export default UserClubController; 