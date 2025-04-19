export function createBindParams(data: Record<string, any>): string {
	if (!data || Object.keys(data).length === 0) return '';
	
	const params = Object.keys(data).map(key => `${key} = ?`).join(', ');
	return params;
}

export function assertUsernameCharacters(username: string): void {
	// Verificar se o nome de usuário contém apenas caracteres válidos
	// Esta é uma implementação simples, você pode ajustar conforme necessário
	const validCharsRegex = /^[a-zA-Z0-9_]+$/;
	if (!validCharsRegex.test(username)) {
		throw new Error('Nome de usuário contém caracteres inválidos');
	}
}