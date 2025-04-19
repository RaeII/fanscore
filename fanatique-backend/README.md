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
