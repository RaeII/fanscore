import { getErrorMessage } from '@/helpers/response_collection';
import MatchDatabase from '@/database/Match.database';
import ClubService from './Club.service';
import StadiumService from './Stadium.service';
import { Match, MatchBasicInfo, MatchDetailedInfo, MatchForFront, MatchInsert, MatchUpdatePayload, MatchUpdate } from '../types';

class MatchService {
	private database: MatchDatabase;
	private clubService: ClubService;
	private stadiumService: StadiumService;

	constructor() {
		this.database = new MatchDatabase();
		this.clubService = new ClubService();
		this.stadiumService = new StadiumService();
	}

	async create(data: MatchInsert): Promise<number> {
		if (!data.home_club_id) throw Error(getErrorMessage('missingField', 'Clube mandante'));
		if (!data.away_club_id) throw Error(getErrorMessage('missingField', 'Clube visitante'));
		if (!data.stadium_id) throw Error(getErrorMessage('missingField', 'Estádio'));
		if (!data.match_date) throw Error(getErrorMessage('missingField', 'Data da partida'));
		
		// Verifica se o clube mandante existe
		const homeClub = await this.clubService.fetch(data.home_club_id);
		if (!homeClub) throw Error(getErrorMessage('registryNotFound', 'Clube mandante'));
		
		// Verifica se o clube visitante existe
		const awayClub = await this.clubService.fetch(data.away_club_id);
		if (!awayClub) throw Error(getErrorMessage('registryNotFound', 'Clube visitante'));
		
		// Verifica se o estádio existe
		const stadium = await this.stadiumService.fetch(data.stadium_id);
		if (!stadium) throw Error(getErrorMessage('registryNotFound', 'Estádio'));

		console.log('stadium', stadium.club_id);
		console.log('data.home_club_id', data.home_club_id);
		
		// Verifica se o estádio pertence ao clube mandante
		if (stadium.club_id != data.home_club_id) {
			throw Error(getErrorMessage('stadiumNotBelongsToHomeClub'));
		}

		const insertData: MatchInsert = {
			home_club_id: data.home_club_id,
			away_club_id: data.away_club_id,
			stadium_id: data.stadium_id,
			match_date: data.match_date,
			is_started: data.is_started || 0
		};

		const result: any = await this.database.create(insertData);
		return result[0].insertId;
	}

	async fetch(id: number): Promise<Match | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id da partida'));

		return await this.database.fetch(id);
	}

	async fetchAll(): Promise<Array<MatchBasicInfo>> {
		return await this.database.fetchAll();
	}

	async fetchForFront(id: number): Promise<MatchForFront | null> {
		if (!id) throw Error(getErrorMessage('missingField', 'Id da partida'));

		const match = await this.database.fetchForFront(id);
		
		// Validação adicional para garantir que as informações estejam presentes
		if (match) {
			if (!match.stadium) {
				throw Error(getErrorMessage('registryNotFound', 'Informações do estádio'));
			}
			
			if (!match.home_club) {
				throw Error(getErrorMessage('registryNotFound', 'Informações do clube mandante'));
			}
			
			if (!match.away_club) {
				throw Error(getErrorMessage('registryNotFound', 'Informações do clube visitante'));
			}
		}
		
		return match;
	}

	async fetchByClubId(clubId: number): Promise<Array<MatchDetailedInfo>> {
		if (!clubId) throw Error(getErrorMessage('missingField', 'Id do clube'));

		const matches = await this.database.fetchByClubId(clubId);
		
		// Verifique se todos os dados necessários estão presentes
		for (const match of matches) {
			if (!match.home_club || !match.away_club || !match.stadium) {
				throw Error(getErrorMessage('registryNotFound', 'Informações completas das partidas'));
			}
		}
		
		return matches;
	}
	
	async fetchByStadiumId(stadiumId: number): Promise<Array<MatchBasicInfo>> {
		if (!stadiumId) throw Error(getErrorMessage('missingField', 'Id do estádio'));

		return await this.database.fetchByStadiumId(stadiumId);
	}

	async update(data: MatchUpdatePayload, id: number) {
		const match = await this.fetch(id);
		if (!match) throw Error(getErrorMessage('registryNotFound', 'Partida'));
		
		const toUpdate: MatchUpdate = {};

		if (data?.home_club_id) {
			// Verifica se o clube mandante existe
			const homeClub = await this.clubService.fetch(data.home_club_id);
			if (!homeClub) throw Error(getErrorMessage('registryNotFound', 'Clube mandante'));
			
			toUpdate.home_club_id = data.home_club_id;
		}
		
		if (data?.away_club_id) {
			// Verifica se o clube visitante existe
			const awayClub = await this.clubService.fetch(data.away_club_id);
			if (!awayClub) throw Error(getErrorMessage('registryNotFound', 'Clube visitante'));
			
			toUpdate.away_club_id = data.away_club_id;
		}
		
		if (data?.stadium_id) {
			// Verifica se o estádio existe
			const stadium = await this.stadiumService.fetch(data.stadium_id);
			if (!stadium) throw Error(getErrorMessage('registryNotFound', 'Estádio'));
			
			// Verifica se o estádio pertence ao clube mandante atualizado ou existente
			const homeClubId = data.home_club_id || match.home_club_id;
			if (stadium.club_id !== homeClubId) {
				throw Error(getErrorMessage('stadiumNotBelongsToHomeClub'));
			}
			
			toUpdate.stadium_id = data.stadium_id;
		}
		
		if (data?.match_date) {
			toUpdate.match_date = data.match_date;
		}
		
		if (data?.is_started !== undefined) {
			toUpdate.is_started = data.is_started;
		}

		if (Object.keys(toUpdate).length === 0) throw Error(getErrorMessage('noValidDataFound'));

		await this.database.update(toUpdate, id);
	}

	async remove(id: number): Promise<void> {
		await this.database.delete(id);
	}
}

export default MatchService; 