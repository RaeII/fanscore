/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { UserClub, UserClubInsert } from '../types';

class UserClubDatabase extends Database {

    async create(data: UserClubInsert) {
        const mysqlBind = createBindParams(data);

        return await this.query(`INSERT INTO user_club SET ${mysqlBind};`, Object.values(data));
    }

    async fetchById(id: number): Promise<UserClub | null> {
        const rows: any = await this.query('SELECT * FROM user_club WHERE id = ?;', [id]);

        return rows[0]?.length > 0 ? rows[0][0] as UserClub : null;
    }

    async fetchByUserClub(userId: number, clubId: number): Promise<UserClub | null> {
        const rows: any = await this.query('SELECT * FROM user_club WHERE user_id = ? AND club_id = ?;', [userId, clubId]);

        return rows[0]?.length > 0 ? rows[0][0] as UserClub : null;
    }

    async fetchByUserId(userId: number): Promise<UserClub[]> {
        const rows: any = await this.query('SELECT * FROM user_club WHERE user_id = ?;', [userId]);

        return rows[0] as UserClub[];
    }

    async fetchAllByUserId(userId: number): Promise<UserClub[]> {
        const rows: any = await this.query(`
            SELECT 
                uc.id,
                uc.user_id,
                uc.club_id,
                uc.club_type_id,
                uc.register_date,
                uc.update_date,
                c.name as club_name,
                ct.name as club_type_name
            FROM user_club uc
            JOIN club c ON uc.club_id = c.id
            JOIN club_type ct ON uc.club_type_id = ct.id
            WHERE uc.user_id = ?;
        `, [userId]);

        return rows[0];
    }

    async fetchFavoriteClub(userId: number): Promise<UserClub | null> {
        const rows: any = await this.query('SELECT * FROM user_club WHERE user_id = ? AND club_type_id = 1;', [userId]);

        return rows[0]?.length > 0 ? rows[0][0] as UserClub : null;
    }

    async update(data: any, id: number) {
        const mysqlBind = createBindParams(data);

        return await this.query(`UPDATE user_club SET ${mysqlBind}, update_date = now() WHERE id = ?;`, [...Object.values(data), id]);
    }

    async delete(id: number) {
        return await this.query('DELETE FROM user_club WHERE id = ?;', [id]);
    }

    /**
     * Busca informações detalhadas dos clubes do usuário
     * @param userId ID do usuário
     * @returns Clubes do usuário com informações detalhadas
     */
    async fetchDetailedByUserId(userId: number): Promise<any[]> {
        const rows: any = await this.query(`
            SELECT 
                uc.id,
                uc.user_id,
                uc.club_id,
                uc.club_type_id,
                uc.register_date,
                uc.update_date,
                c.id as club_id,
                c.name as club_name,
                c.image as club_image,
                c.register_date as club_register_date,
                c.update_date as club_update_date,
                ct.id as club_type_id,
                s.id as stadium_id,
                s.name as stadium_name,
                s.image as stadium_image,
                s.city,
                s.state
              
            FROM user_club uc
            JOIN club c ON uc.club_id = c.id
            JOIN club_type ct ON uc.club_type_id = ct.id
            LEFT JOIN stadium s ON s.club_id = c.id
            WHERE uc.user_id = ?
            ORDER BY uc.club_type_id ASC;
        `, [userId]);

        return rows[0];
    }
}

export default UserClubDatabase; 