# Fanatique Backend

## API de Clubes

### Enviar imagem como base64 para API

Para criar ou atualizar um clube com imagem, envie o corpo da requisição como JSON com os seguintes campos:

```json
{
  "name": "Nome do Clube",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/..."
}
```

Para converter uma imagem para base64 no frontend:

```javascript
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Exemplo de uso:
// No input de imagem do seu formulário:
inputElement.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  const base64 = await convertImageToBase64(file);
  // Use base64 para enviar para o backend
});
```

### Endpoints da API de Clubes

- `POST /club` - Criar um novo clube (requer autenticação)
- `GET /club/:id` - Obter um clube específico
- `GET /club` - Listar todos os clubes
- `PUT /club/:id` - Atualizar um clube (requer autenticação)
- `DELETE /club/:id` - Excluir um clube (requer autenticação)


Agora quero que crie os arquivos para um CRUD para adicionar partidas com  clubes já cadastrados utilize o mesmo padrão dos arquivo: @stadium.routes.ts @Stadium.controller.ts @Stadium.service.ts @Stadium.database.ts 
Se for criar um erro personalizado verifique se tem em @response_collection.ts se não tiver crie ou use o que já existe
Lembrando que o estadio da partida sempre será "home_club_id":
CREATE TABLE `match` (
  `id` int NOT NULL AUTO_INCREMENT,
  `home_club_id` int NOT NULL,
  `away_club_id` int NOT NULL,
  `stadium_id` int NOT NULL,
  `is_started` tinyint NOT NULL DEFAULT '0',
  `match_date` datetime NOT NULL,
  `register_date` datetime NOT NULL,
  `update_date` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_match_1_idx` (`home_club_id`),
  KEY `fk_match_2_idx` (`away_club_id`),
  KEY `fk_match_3_idx` (`stadium_id`),
  CONSTRAINT `fk_match_1` FOREIGN KEY (`home_club_id`) REFERENCES `club` (`id`),
  CONSTRAINT `fk_match_2` FOREIGN KEY (`away_club_id`) REFERENCES `club` (`id`),
  CONSTRAINT `fk_match_3` FOREIGN KEY (`stadium_id`) REFERENCES `stadium` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

Faça os arquivos em @fanatique-backend 


Agora quero que crie uma pagina para cadastrar estabelecimentos como fez em @admin-clubs.jsx para cadastrar clubes, mas agora faça para cadastrar estabelecimentos e salvar esses dados: const body: EstablishmentInsert = { name: req.body.name, segment: req.body.segment, image: req.body.image };
Utilize as rotas @establishment.routes.ts essa pagina





