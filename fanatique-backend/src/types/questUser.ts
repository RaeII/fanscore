import { Quest } from './quest';

export interface QuestUser {
  id: number;
  user_id: number;
  quest_id: number;
  match_id?: number | null;
  status: number;
  register_date: Date;
  update_date: Date | null;
}

export interface QuestUserInsert {
  user_id: number;
  quest_id: number;
  match_id?: number | null;
  status?: number;
}

export interface QuestUserUpdate {
  status?: number;
  match_id?: number | null;
}

export interface QuestUserUpdatePayload {
  status?: number;
  match_id?: number | null;
}

// Definindo uma versão simplificada de Quest para uso em QuestUserForFront
export interface QuestInfo {
  id: number;
  name: string;
  description: string;
  image?: string;
  type: number;
  scope: number;
  point_value: number;
  register_date: Date;
}

export interface QuestUserForFront {
  id: number;
  user_id: number;
  quest_id: number;
  match_id?: number | null;
  status: number;
  register_date: Date;
  update_date: Date | null;
  quest?: QuestInfo;
}

export interface QuestUserBasicInfo {
  id: number;
  user_id: number;
  quest_id: number;
  match_id?: number | null;
  status: number;
} 