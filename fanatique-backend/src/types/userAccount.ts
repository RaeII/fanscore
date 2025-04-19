export interface UserAccount {
  id: number;
  name: string;
  wallet_address: string;
  register_date: Date;
  update_date?: Date;
}

export interface UserAccountForFront {
  id: number;
  name: string;
  wallet_address: string;
}

export interface UserAccountInsertPayload {
  name: string;
  wallet_address: string;
}

export interface UserAccountUpdatePayload {
  name?: string;
  wallet_address?: string;
}

export interface UserAccountInsert {
  name: string;
  wallet_address: string;
}

export interface UserAccountUpdate {
  name?: string;
  wallet_address?: string;
}

export interface UserAccountBasicInfo {
  id: number;
  name: string;
  wallet_address: string;
}

export interface UserAccountLogin {
  id: number;
  name: string;
  wallet_address: string;
} 