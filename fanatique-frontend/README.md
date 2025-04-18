papalette:
#2a1b49
#f24952
#0d0117
#fafafa

# Fanatique Backend

## Estrutura da Tabela de Usuários

A tabela de usuários foi atualizada com a seguinte estrutura:

```sql
CREATE TABLE users (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `wallet_address` varchar(45) NOT NULL,
  `register_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

## Arquivos Atualizados

1. **Tipos (types/index.ts)**
   - Criadas interfaces para refletir a nova estrutura da tabela
   - Removidas propriedades não utilizadas (email, password, etc.)

2. **Helpers**
   - Criado arquivo `response_collection.ts` com mensagens de erro e sucesso
   - Criado arquivo `util.ts` com funções utilitárias

3. **Controllers**
   - Ajustado `User.controller.ts` para utilizar name e wallet_address
   - Implementado Controller base e AuthController

4. **Serviços**
   - Ajustado `User.service.ts` para trabalhar com os novos campos
   - Removidos métodos não mais aplicáveis

5. **Database**
   - Atualizado `User.database.ts` com queries adaptadas à nova estrutura
   - Implementada classe Database base

6. **Middleware**
   - Implementado middleware JWT para autenticação

7. **Rotas**
   - Ajustada rota para verificar unicidade de wallet_address
   - Mantida a estrutura geral das rotas

## Funcionalidades Principais

- Criação de usuário (name, wallet_address)
- Autenticação via JWT
- Busca de usuários (individual e listagem)
- Validação de campos únicos
- Atualização e remoção de usuários

## Como usar

1. Configure as variáveis de ambiente (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET)
2. Execute o servidor
3. Acesse as rotas via API:
   - POST /user - Criar usuário
   - GET /user - Buscar usuário autenticado
   - GET /user/all - Listar todos usuários
   - PUT /user - Atualizar usuário
   - DELETE /user - Remover usuário