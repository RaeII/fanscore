export interface Club {
  id: number;
  name: string;
  image: string;
  register_date: Date;
  update_date?: Date;
  symbol: string;
}

export interface ClubForFront {
  id: number;
  name: string;
  image: string;
  symbol: string;
}

export interface ClubInsertPayload {
  name: string;
  image: string;
  symbol: string;
}

export interface ClubUpdatePayload {
  name?: string;
  image?: string;
  symbol?: string;
}

export interface ClubInsert {
  name: string;
  image: string;
  symbol: string;
}

export interface ClubUpdate {
  name?: string;
  image?: string;
  symbol?: string;
}

export interface ClubBasicInfo {
  id: number;
  name: string;
  image: string;
  symbol: string;
} 