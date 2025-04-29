import { getErrorMessage } from '@/helpers/response_collection';
import UserClubDatabase from '@/database/UserClub.database';
import MatchService from './Match.service';
import StadiumService from './Stadium.service';
import ClubService from './Club.service';
import { UserClub, UserClubInsert, UserClubUpdate } from '../types';

class UserClubService {
    private database: UserClubDatabase;
    private matchService: MatchService;
    private stadiumService: StadiumService;
    private clubService: ClubService;

    constructor() {
        this.database = new UserClubDatabase();
        this.matchService = new MatchService();
        this.stadiumService = new StadiumService();
        this.clubService = new ClubService();
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
        
        // Se for clube favorito, criar uma partida demonstrativa
        if (data.club_type_id === 1) {
            await this.createDemoMatchForFavoriteClub(data.club_id);
        }
        
        return result[0].insertId;
    }

    // Função para criar uma partida demonstrativa para o clube favorito
    private async createDemoMatchForFavoriteClub(clubId: number): Promise<void> {

        console.log('clubId  createDemoMatchForFavoriteClub', clubId);
        // Verificar se o clube já tem partidas
        const matches = await this.matchService.fetchByClubId(clubId);
        if (matches && matches.length > 0) {
            // Clube já tem partidas, não precisamos criar uma nova
            return;
        }
        
        // Buscar estádio do clube
        const stadium = await this.stadiumService.fetchByClubId(clubId);
        if (!stadium) {
            // Clube não tem estádio, não podemos criar a partida
            return;
        }
        
        // Buscar outro clube aleatório para ser o visitante
        const allClubs = await this.clubService.fetchAll();
        const otherClubs = allClubs.filter(club => club.id !== clubId);
        
        if (otherClubs.length === 0) {
            // Não há outros clubes disponíveis
            return;
        }
        
        // Selecionar um clube aleatório como visitante
        const randomIndex = Math.floor(Math.random() * otherClubs.length);
        const awayClub = otherClubs[randomIndex];
        
        // Criar a partida com data e hora atual
        await this.matchService.create({
            home_club_id: clubId,
            away_club_id: awayClub.id,
            stadium_id: stadium.id,
            match_date: new Date(),
            is_started: 1 // Definir como partida já iniciada
        });
            
    }

    async fetchByUserId(userId: number): Promise<UserClub[]> {
        if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

        return await this.database.fetchByUserId(userId);
    }

    async fetchAllByUserId(userId: number): Promise<UserClub[]> {
        if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

        return await this.database.fetchAllByUserId(userId);
    }

    /**
     * Retorna informações detalhadas dos clubes do usuário
     * @param userId ID do usuário
     * @returns Array com os clubes do usuário incluindo informações completas de cada clube
     */
    async fetchClubsWithDetails(userId: number): Promise<any[]> {
        if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

        // Buscar detalhes dos clubes diretamente do banco de dados com JOIN
        const detailedClubs = await this.database.fetchDetailedByUserId(userId);
        
        // Formatar os dados para um formato mais estruturado
        return detailedClubs.map(club => {
            return {
                id: club.id,
                user_id: club.user_id,
                club_type: {
                    id: club.club_type_id,
                    name: club.club_type_name
                },
                register_date: club.register_date,
                update_date: club.update_date,
                club: {
                    id: club.club_id,
                    name: club.club_name,
                    image: club.club_image,
                    register_date: club.club_register_date,
                    update_date: club.club_update_date,
                    stadium: club.stadium_id ? {
                        id: club.stadium_id,
                        name: club.stadium_name,
                        image: club.stadium_image,
                        city: club.city,
                        state: club.state
                    } : null
                }
            };
        });
    }

    async update(data: UserClubUpdate, userClubId: number, userId: number): Promise<void> {
        if (!userClubId) throw Error(getErrorMessage('missingField', 'ID do clube do usuário'));
        if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));
        
        const toUpdate: UserClubUpdate = {};
        let createDemoMatch = false;
        let clubId: number | undefined;
        
        if (data.club_id !== undefined) {
            toUpdate.club_id = data.club_id;
            clubId = data.club_id;
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
                
                createDemoMatch = true;
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
        
        // Se estiver atualizando para clube favorito, criar partida demonstrativa
        if (createDemoMatch) {
            // Usa o clubId atualizado ou o existente no userClub
            const finalClubId = clubId || userClub.club_id;
            await this.createDemoMatchForFavoriteClub(finalClubId);
        }
    }

    async remove(clubId: number, userId: number): Promise<void> {
        if (!clubId) throw Error(getErrorMessage('missingField', 'ID do clube'));
        if (!userId) throw Error(getErrorMessage('missingField', 'ID do usuário'));

        // Verificar se o userClubId pertence ao usuário
        const userClub = await this.database.fetchByUserClub(userId, clubId);
        
        if (!userClub || userClub.user_id !== userId) {
            throw Error(getErrorMessage('notFound', 'Clube do usuário'));
        }

        await this.database.delete(userClub.id);
    }
}

export default UserClubService; 