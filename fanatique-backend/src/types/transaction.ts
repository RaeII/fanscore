import { UserAccountBasicInfo } from './userAccount';

export interface Transaction {
  id: number;
  hash: string;
  value: number;
  user_id: number;
  date_register: Date;
}

export interface TransactionBasicInfo {
  id: number;
  hash: string;
  value: number;
  user_id: number;
}

export interface TransactionInsert {
  hash: string;
  value: number;
  user_id: number;
  club_id: number;
}

export interface TransactionForFront extends TransactionBasicInfo {
  date_register: string;
  user?: UserAccountBasicInfo;
}

export interface TransferTokenPayload {
  club_id: number;
  to: string;
  amount: string;
} 