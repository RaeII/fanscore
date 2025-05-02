export interface Stablecoin {
    id: number;
    name: string;
    symbol: string;
    image: string;
    address: string;
}

export interface StablecoinBasicInfo {
    id: number;
    name: string;
    symbol: string;
    image: string;
    address: string;
}

export interface StablecoinInsertPayload {
    name: string;
    symbol: string;
    image: string;
    address: string;
}

export interface StablecoinUpdatePayload {
    name?: string;
    symbol?: string;
    image?: string;
    address?: string;
}

export interface StablecoinUpdate {
    name?: string;
    symbol?: string;
    image?: string;
    address?: string;
} 