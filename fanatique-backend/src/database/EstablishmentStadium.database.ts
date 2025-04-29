import Database from './Database';
import { EstablishmentStadium, EstablishmentStadiumBasicInfo, EstablishmentStadiumInsert, EstablishmentStadiumUpdate } from '../types';

class EstablishmentStadiumDatabase extends Database {
	async create(data: EstablishmentStadiumInsert): Promise<any> {
		const query = `
			INSERT INTO establishment_stadium (establishment_id, stadium_id)
			VALUES (?, ?)
		`;
		
		return await this.query(query, [
			data.establishment_id, 
			data.stadium_id
		]);
	}

	async fetch(id: number): Promise<EstablishmentStadium | null> {
		const query = `
			SELECT id, establishment_id, stadium_id, register_date, update_date
			FROM establishment_stadium
			WHERE id = ?
		`;
		
		const [result] = await this.query(query, [id]);
		return result.length > 0 ? result[0] : null;
	}

	async fetchAll(): Promise<Array<EstablishmentStadiumBasicInfo>> {
		const query = `
			SELECT es.id, 
				   es.establishment_id, 
				   es.stadium_id,
				   e.name as establishment_name,
				   s.name as stadium_name
			FROM establishment_stadium es
			JOIN establishment e ON es.establishment_id = e.id
			JOIN stadium s ON es.stadium_id = s.id
			ORDER BY es.id DESC
		`;
		
		const [result] = await this.query(query);
		return result;
	}

	async fetchByStadiumId(stadiumId: number): Promise<Array<EstablishmentStadiumBasicInfo>> {
		const query = `
			SELECT es.id, 
				   es.establishment_id, 
				   es.stadium_id,
				   e.name as establishment_name,
				   e.image,
				   s.name as stadium_name
			FROM establishment_stadium es
			JOIN establishment e ON es.establishment_id = e.id
			JOIN stadium s ON es.stadium_id = s.id
			WHERE es.stadium_id = ?
			ORDER BY es.id DESC
		`;
		
		const [result] = await this.query(query, [stadiumId]);
		return result;
	}
	
	async fetchByEstablishmentId(establishmentId: number): Promise<Array<EstablishmentStadiumBasicInfo>> {
		const query = `
			SELECT es.id, 
				   es.establishment_id, 
				   es.stadium_id,
				   e.name as establishment_name,
				   s.name as stadium_name
			FROM establishment_stadium es
			JOIN establishment e ON es.establishment_id = e.id
			JOIN stadium s ON es.stadium_id = s.id
			WHERE es.establishment_id = ?
			ORDER BY es.id DESC
		`;
		
		const [result] = await this.query(query, [establishmentId]);
		return result;
	}

	async fetchByStadiumAndEstablishment(stadiumId: number, establishmentId: number): Promise<EstablishmentStadium | null> {
		const query = `
			SELECT id, establishment_id, stadium_id, register_date, update_date
			FROM establishment_stadium
			WHERE stadium_id = ? AND establishment_id = ?
		`;
		
		const [result] = await this.query(query, [stadiumId, establishmentId]);
		return result.length > 0 ? result[0] : null;
	}

	async update(data: EstablishmentStadiumUpdate, id: number): Promise<void> {
		const fields: string[] = [];
		const values: any[] = [];

		// Adicionar campos a serem atualizados
		if (data.establishment_id !== undefined) {
			fields.push('establishment_id = ?');
			values.push(data.establishment_id);
		}
		
		if (data.stadium_id !== undefined) {
			fields.push('stadium_id = ?');
			values.push(data.stadium_id);
		}

		fields.push('update_date = NOW()');
		
		const query = `
			UPDATE establishment_stadium
			SET ${fields.join(', ')}
			WHERE id = ?
		`;
		
		values.push(id);
		await this.query(query, values);
	}

	async delete(id: number): Promise<void> {
		const query = `
			DELETE FROM establishment_stadium
			WHERE id = ?
		`;
		
		await this.query(query, [id]);
	}
}

export default EstablishmentStadiumDatabase; 