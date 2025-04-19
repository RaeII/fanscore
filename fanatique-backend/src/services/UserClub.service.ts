import { getErrorMessage } from '@/helpers/response_collection';
import UserClubDatabase from '@/database/UserClub.database';
import { UserClub, UserClubInsert, UserClubUpdate } from '../types';

class UserClubService {
    private database: UserClubDatabase;

    constructor() {
        this.database = new UserClubDatabase(); 
    }

    async create(data: UserClubInsert): Promise<number> {
        if (!data.user_id) throw Error(getErrorMessage('missingField', 'ID do usuário'));
        if (!data.club_id) throw Error(getErrorMessage('missingField', 'ID do clube'));
        if (!data.club_type_id) throw Error(getErrorMessage('missingField', 'Tipo de clube'));

        // Verificar se o tipo de clube é válido (1 ou 2)
        if (data.club_type_id !== 1 && data.club_type_id !== 2) {
            throw Error(getErrorMessage('invalidField', 'Tipo de clube (deve ser 1-FAVORITE ou 2-SECONDARY)'));
        }

        // Se for clube favorito (tipo 1), verificar se já existe um favorito
        if (data.club_type_id === 1) {
            const favoriteClub = await this.database.fetchFavoriteClub(data.user_id);
            if (favoriteClub) {
                throw Error(getErrorMessage('alreadyExists', 'Clube favorito para este usuário'));
            }
        }

        const result: any = await this.database.create(data);
        return result[0].insertId;
    }

    async fetchByUserId(userId: number): Promise<UserClub[]> {
        if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

        return await this.database.fetchByUserId(userId);
    }

    async fetchAllByUserId(userId: number): Promise<UserClub[]> {
        if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

        return await this.database.fetchAllByUserId(userId);
    }

    async update(data: UserClubUpdate, userClubId: number, userId: number): Promise<void> {
        if (!userClubId) throw Error(getErrorMessage('missingField', 'ID do clube do usuário'));
        if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));
        
        const toUpdate: UserClubUpdate = {};
        
        if (data.club_id !== undefined) {
            toUpdate.club_id = data.club_id;
        }
        
        if (data.club_type_id !== undefined) {
            // Verificar se o tipo de clube é válido (1 ou 2)
            if (data.club_type_id !== 1 && data.club_type_id !== 2) {
                throw Error(getErrorMessage('invalidField', 'Tipo de clube (deve ser 1-FAVORITE ou 2-SECONDARY)'));
            }
            
            // Se for clube favorito (tipo 1), verificar se já existe um favorito
            if (data.club_type_id === 1) {
                const favoriteClub = await this.database.fetchFavoriteClub(userId);
                
                // Se já existe um favorito diferente do atual, não permitir atualização
                if (favoriteClub && favoriteClub.id !== userClubId) {
                    throw Error(getErrorMessage('alreadyExists', 'Clube favorito para este usuário'));
                }
            }
            
            toUpdate.club_type_id = data.club_type_id;
        }

        if (Object.keys(toUpdate).length === 0) {
            throw Error(getErrorMessage('noValidDataFound'));
        }

        // Verificar se o userClubId pertence ao usuário
        const userClub = await this.database.fetchById(userClubId);
        if (!userClub || userClub.user_id !== userId) {
            throw Error(getErrorMessage('notFound', 'Clube do usuário'));
        }

        await this.database.update(toUpdate, userClubId);
    }

    async remove(userClubId: number, userId: number): Promise<void> {
        if (!userClubId) throw Error(getErrorMessage('missingField', 'ID do clube do usuário'));
        if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

        // Verificar se o userClubId pertence ao usuário
        const userClub = await this.database.fetchById(userClubId);
        if (!userClub || userClub.user_id !== userId) {
            throw Error(getErrorMessage('notFound', 'Clube do usuário'));
        }

        await this.database.delete(userClubId);
    }
}

export default UserClubService; 