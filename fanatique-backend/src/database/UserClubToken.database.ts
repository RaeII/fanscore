import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { UserClubToken, UserClubTokenBasicInfo, UserClubTokenInsert } from '../types';

class UserClubTokenDatabase extends Database {
  async create(data: UserClubTokenInsert) {
    const mysqlBind = createBindParams(data);
    return await this.query(`INSERT INTO user_club_token SET ${mysqlBind};`, Object.values(data));
  }

  async fetch(id: number): Promise<UserClubToken | null> {
    const rows: any = await this.query('SELECT * FROM user_club_token WHERE id = ?;', [id]);
    return rows[0]?.length > 0 ? rows[0][0] as UserClubToken : null;
  }

  async fetchByUserAndClub(userId: number, clubId: number): Promise<UserClubToken | null> {
    const rows: any = await this.query(
      'SELECT * FROM user_club_token WHERE user_id = ? AND club_id = ?;', 
      [userId, clubId]
    );
    return rows[0]?.length > 0 ? rows[0][0] as UserClubToken : null;
  }

  async fetchAllByUser(userId: number): Promise<Array<UserClubTokenBasicInfo>> {
    const rows: any = await this.query(
      'SELECT id, user_id, club_id, total FROM user_club_token WHERE user_id = ?;', 
      [userId]
    );
    return rows[0];
  }

  async update(userId: number, clubId: number, total: number) {
    return await this.query(
      'UPDATE user_club_token SET total = ?, date_register = now() WHERE user_id = ? AND club_id = ?;', 
      [total, userId, clubId]
    );
  }

  async delete(id: number) {
    return await this.query('DELETE FROM user_club_token WHERE id = ?;', [id]);
  }
}

export default UserClubTokenDatabase; 