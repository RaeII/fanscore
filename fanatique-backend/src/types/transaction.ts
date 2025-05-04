import { UserAccountBasicInfo } from './userAccount';

export interface ClubBasicInfo {
  id: number;
  name: string;
  image: string;
  symbol: string;
}

export interface StablecoinBasicInfo {
  id: number;
  name: string;
  image: string;
  symbol: string;
}

export interface Transaction {
  id: number;
  hash: string;
  value: number;
  user_id: number;
  date_register: Date;
  club_id?: number;
  stable_id?: number;
}

export interface TransactionBasicInfo {
  id: number;
  hash: string;
  value: number;
  user_id: number;
  club_id?: number;
  stable_id?: number;
  club?: ClubBasicInfo;
  stablecoin?: StablecoinBasicInfo;
}

export interface TransactionInsert {
  hash: string;
  value: number;
  user_id: number;
  club_id?: number;
  stable_id?: number;
}

export interface TransactionForFront extends TransactionBasicInfo {
  date_register: string;
  user?: UserAccountBasicInfo;
  club?: ClubBasicInfo;
  stablecoin?: StablecoinBasicInfo;
}

export interface TransferTokenPayload {
  club_id: number;
  to: string;
  amount: string;
}

export interface TransferStablecoinPayload {
  stablecoin_id: number;
  to: string;
  amount: string;
} 