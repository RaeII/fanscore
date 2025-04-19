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