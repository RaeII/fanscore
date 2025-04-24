/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBindParams } from '@/helpers/util';
import Database from './Database';
import { Match, MatchBasicInfo, MatchForFront, MatchInsert } from '../types';

class MatchDatabase extends Database {

	async create(data: MatchInsert) {
		const mysqlBind = createBindParams(data);

		return await this.query(`INSERT INTO \`match\` SET ${mysqlBind};`, Object.values(data));
	}

	async fetchForFront(id: number): Promise<MatchForFront | null> {
		const rows: any = await this.query(`
			SELECT
				m.id,
				m.home_club_id,
				m.away_club_id,
				m.stadium_id,
				m.is_started,
				m.match_date,
				hc.name as home_club_name,
				ac.name as away_club_name,
				s.name as stadium_name,
				s.id as stadium_id,
				s.name as stadium_name,
				s.image as stadium_image,
				s.city as stadium_city,
				s.state as stadium_state,
				s.club_id as stadium_club_id
			FROM \`match\` m
			LEFT JOIN club hc ON m.home_club_id = hc.id
			LEFT JOIN club ac ON m.away_club_id = ac.id
			LEFT JOIN stadium s ON m.stadium_id = s.id
			WHERE m.id = ?;`, [id]);

		if (rows[0]?.length > 0) {
			const matchData = rows[0][0];
			// Formatar o resultado para incluir o objeto stadium
			return {
				id: matchData.id,
				home_club_id: matchData.home_club_id,
				away_club_id: matchData.away_club_id,
				stadium_id: matchData.stadium_id,
				is_started: matchData.is_started,
				match_date: matchData.match_date,
				home_club_name: matchData.home_club_name,
				away_club_name: matchData.away_club_name,
				stadium_name: matchData.stadium_name,
				stadium: {
					id: matchData.stadium_id,
					name: matchData.stadium_name,
					image: matchData.stadium_image,
					city: matchData.stadium_city,
					state: matchData.stadium_state,
					club_id: matchData.stadium_club_id
				}
			};
		}
		
		return null;
	}

	async fetch(id: number): Promise<Match | null> {
		const rows: any = await this.query('SELECT * FROM `match` WHERE id = ?;', [id]);

		return rows[0]?.length > 0 ? rows[0][0] as Match : null;
	}

	async fetchAll(): Promise<Array<MatchBasicInfo>> {
		const rows: any = await this.query(`
			SELECT
				m.id,
				m.home_club_id,
				m.away_club_id,
				m.stadium_id,
				m.is_started,
				m.match_date,
				hc.name as home_club_name,
				ac.name as away_club_name,
				s.name as stadium_name
			FROM \`match\` m
			LEFT JOIN club hc ON m.home_club_id = hc.id
			LEFT JOIN club ac ON m.away_club_id = ac.id
			LEFT JOIN stadium s ON m.stadium_id = s.id
			ORDER BY m.match_date DESC;`, []);

		return rows[0];
	}

	async fetchByClubId(clubId: number): Promise<Array<MatchBasicInfo>> {
		const rows: any = await this.query(`
			SELECT
				m.id,
				m.home_club_id,
				m.away_club_id,
				m.stadium_id,
				m.is_started,
				m.match_date,
				hc.name as home_club_name,
				ac.name as away_club_name,
				s.name as stadium_name
			FROM \`match\` m
			LEFT JOIN club hc ON m.home_club_id = hc.id
			LEFT JOIN club ac ON m.away_club_id = ac.id
			LEFT JOIN stadium s ON m.stadium_id = s.id
			WHERE m.home_club_id = ? OR m.away_club_id = ?
			ORDER BY m.match_date DESC;`, [clubId, clubId]);

		return rows[0];
	}
	
	async fetchByStadiumId(stadiumId: number): Promise<Array<MatchBasicInfo>> {
		const rows: any = await this.query(`
			SELECT
				m.id,
				m.home_club_id,
				m.away_club_id,
				m.stadium_id,
				m.is_started,
				m.match_date,
				hc.name as home_club_name,
				ac.name as away_club_name,
				s.name as stadium_name
			FROM \`match\` m
			LEFT JOIN club hc ON m.home_club_id = hc.id
			LEFT JOIN club ac ON m.away_club_id = ac.id
			LEFT JOIN stadium s ON m.stadium_id = s.id
			WHERE m.stadium_id = ?
			ORDER BY m.match_date DESC;`, [stadiumId]);

		return rows[0];
	}

	async update(data: any, id: number) {
		const mysqlBind = createBindParams(data);

		return await this.query(`UPDATE \`match\` SET ${mysqlBind}, update_date = now() WHERE id = ?;`, [...Object.values(data), id]);
	}

	async delete(id: number) {
		return await this.query('DELETE FROM `match` WHERE id = ?;', [id]);
	}
}

export default MatchDatabase; 