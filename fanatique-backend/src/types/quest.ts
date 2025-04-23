export interface Quest {
  id: number;
  name: string;
  description: string;
  image?: string;
  type: number;
  scope: number;
  register_date: Date;
  update_date?: Date;
}

export interface QuestBasicInfo {
  id: number;
  name: string;
  description: string;
  image?: string;
  type: number;
  scope: number;
}

export interface QuestForFront extends QuestBasicInfo {
  typeName?: string;
  scopeName?: string;
}

export interface QuestInsert {
  name: string;
  description: string;
  image?: string;
  point_value: number;
  type: number;
  scope: number;
}

export interface QuestUpdate {
  name?: string;
  description?: string;
  image?: string;
  point_value?: number;
  type?: number;
  scope?: number;
}

export interface QuestUpdatePayload {
  name?: string;
  description?: string;
  image?: string;
  point_value?: number;
  type?: number;
  scope?: number;
}

export interface QuestType {
  id: number;
  name: string;
}

export interface QuestScope {
  id: number;
  name: string;
} 