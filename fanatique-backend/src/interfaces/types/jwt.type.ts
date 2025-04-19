export interface JwtType {
    user_id: string;
    exp?: number;
    iat?: number;
    
    // Campos adicionais para autenticação baseada em carteira
    address?: string;
    wallet?: string;
} 