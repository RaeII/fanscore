export * from './userAccount';
export * from './club';

// UserClub Types
export interface UserClub {
    id: number;
    user_id: number;
    club_id: number;
    club_type_id: number;
    register_date: string;
    update_date: string | null;
}

export interface UserClubInsert {
    user_id: number;
    club_id: number;
    club_type_id: number;
}

export interface UserClubUpdate {
    club_id?: number;
    club_type_id?: number;
}

export interface Stadium {
  id: number;
  name: string;
  image: string;
  city: string;
  state: string;
  club_id: number;
  register_date: Date;
  update_date: Date | null;
}

export interface StadiumForFront {
  id: number;
  name: string;
  image: string;
  city: string;
  state: string;
  club_id: number;
}

export interface StadiumBasicInfo {
  id: number;
  name: string;
  image: string;
  city: string;
  state: string;
}

export interface StadiumInsert {
  name: string;
  image: string;
  city: string;
  state: string;
  club_id: number;
}

export interface StadiumUpdatePayload {
  name?: string;
  image?: string;
  city?: string;
  state?: string;
}

export interface StadiumUpdate {
  name?: string;
  image?: string;
  city?: string;
  state?: string;
}

// Match types
export interface Match {
  id: number;
  home_club_id: number;
  away_club_id: number;
  stadium_id: number;
  is_started: number;
  match_date: Date;
  register_date: Date;
  update_date: Date;
}

export interface MatchBasicInfo {
  id: number;
  home_club_id: number;
  away_club_id: number;
  stadium_id: number;
  is_started: number;
  match_date: Date;
  home_club_name: string;
  away_club_name: string;
  stadium_name: string;
}

export interface MatchForFront extends MatchBasicInfo {}

export interface MatchInsert {
  home_club_id: number;
  away_club_id: number;
  stadium_id: number;
  match_date: Date;
  is_started: number;
}

export interface MatchUpdatePayload {
  home_club_id?: number;
  away_club_id?: number;
  stadium_id?: number;
  match_date?: Date;
  is_started?: number;
}

export interface MatchUpdate {
  home_club_id?: number;
  away_club_id?: number;
  stadium_id?: number;
  match_date?: Date;
  is_started?: number;
}

// Establishment types
export interface Establishment {
  id: number;
  name: string;
  segment: string;
  image: string;
  register_date: Date;
  update_date: Date | null;
}

export interface EstablishmentBasicInfo {
  id: number;
  name: string;
  segment: string;
  image: string;
}

export interface EstablishmentForFront extends EstablishmentBasicInfo {}

export interface EstablishmentInsert {
  name: string;
  segment: string;
  image: string;
}

export interface EstablishmentUpdatePayload {
  name?: string;
  segment?: string;
  image?: string;
}

export interface EstablishmentUpdate {
  name?: string;
  segment?: string;
  image?: string;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description?: string;
  image: string;
  value_real: string;
  value_tokefan: string;
  establishment: number;
  register_date: string;
  update_date: string | null;
}

export interface ProductBasicInfo {
  id: number;
  name: string;
  description?: string;
  image: string;
  value_real: string;
  value_tokefan: string;
  establishment: number;
}

export interface ProductForFront {
  id: number;
  name: string;
  description?: string;
  image: string;
  value_real: string;
  value_tokefan: string;
  establishment: number;
}

export interface ProductInsert {
  name: string;
  description?: string;
  image: string;
  value_real: string;
  value_tokefan: string;
  establishment: number;
}

export interface ProductUpdatePayload {
  name?: string;
  description?: string;
  image?: string;
  value_real?: string;
  value_tokefan?: string;
  establishment?: number;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  image?: string;
  value_real?: string;
  value_tokefan?: string;
  establishment?: number;
}

// EstablishmentStadium
export interface EstablishmentStadium {
	id: number;
	establishment_id: number;
	stadium_id: number;
	register_date: string;
	update_date: string | null;
}

export interface EstablishmentStadiumBasicInfo {
	id: number;
	establishment_id: number;
	stadium_id: number;
	establishment_name: string;
	stadium_name: string;
}

export interface EstablishmentStadiumInsert {
	establishment_id: number;
	stadium_id: number;
}

export interface EstablishmentStadiumUpdate {
	establishment_id?: number;
	stadium_id?: number;
}

export interface EstablishmentStadiumForFront {
	id: number;
	establishment_id: number;
	stadium_id: number;
	establishment_name: string;
	stadium_name: string;
	register_date: string;
	update_date: string | null;
} 