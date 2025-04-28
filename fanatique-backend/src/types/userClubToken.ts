export interface UserClubToken {
  id: number;
  user_id: number;
  club_id: number;
  total: number;
  date_register?: Date;
}

export interface UserClubTokenInsert {
  user_id: number;
  club_id: number;
  total: number;
}

export interface UserClubTokenUpdate {
  total?: number;
}

export interface UserClubTokenBasicInfo {
  id: number;
  user_id: number;
  club_id: number;
  total: number;
} 