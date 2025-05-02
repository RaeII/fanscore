export * from './userAccount';
export * from './club';
export * from './quest';
export * from './stablecoin';

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
  create_date?: Date;
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

export interface MatchDetailedInfo {
  id: number;
  match_date: Date;
  is_started: number;
  home_club: {
    id: number;
    name: string;
    image: string;
  };
  away_club: {
    id: number;
    name: string;
    image: string;
  };
  stadium: {
    id: number;
    name: string;
    image: string;
    city: string;
    state: string;
    club_id: number;
  };
}

export interface MatchForFront {
  id: number;
  home_club_id: number;
  away_club_id: number;
  stadium_id: number;
  is_started: number;
  match_date: Date;
  home_club_name: string;
  away_club_name: string;
  stadium_name: string;
  stadium: StadiumForFront;
  home_club?: {
    id: number;
    name: string;
    image: string;
  };
  away_club?: {
    id: number;
    name: string;
    image: string;
  };
}

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

// Order Types
export interface Order {
  id: number;
  establishment_id: number;
  user_id: number;
  match_id: number;
  status_id: number;
  total_real: number;
  total_fantoken: number;
  date_register: Date;
}

export interface OrderBasicInfo {
  id: number;
  establishment_id: number;
  establishment_name: string;
  user_id: number;
  match_id: number;
  status_id: number;
  status_name: string;
  total_real: number;
  total_fantoken: number;
}

export interface OrderForFront {
  id: number;
  establishment_id: number;
  establishment_name: string;
  user_id: number;
  match_id: number;
  stadium_name: string;
  status: number;
  status_name: string;
  total_real: number;
  total_fantoken: number;
  date_register: Date;
  products: ProductOrderForFront[];
}

export interface OrderInsert {
  establishment_id: number;
  user_id: number;
  match_id: number;
  status_id: number | null;
  total_real: number;
  total_fantoken: number;
  products: ProductOrderInsert[];
}

export interface OrderUpdatePayload {
  status_id?: number;
  transaction_hash?: string;
  update_date?: Date;
}

export interface OrderUpdate {
  status_id?: number;
  transaction_hash?: string;
  update_date?: Date;
}

// ProductOrder Types
export interface ProductOrder {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
}

export interface ProductOrderBasicInfo {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
}

export interface ProductOrderForFront {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  value_real: string;
  value_tokefan: string;
  quantity: number;
  subtotal_real: number;
  subtotal_tokefan: number;
}

export interface ProductOrderInsert {
  product_id: number;
  quantity: number;
}

export interface ProductOrderUpdatePayload {
  quantity?: number;
}

export interface ProductOrderUpdate {
  quantity?: number;
}

// UserClubToken Types
export * from './userClubToken'; 