import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: 'http://192.168.0.13:3030/api',
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erros aqui
    if (error?.response?.data?.message) {
      console.error('Erro na requisição:', error.response.data.message);
    } else {
      console.error('Erro na requisição:', error);
    }
    return Promise.reject(error);
  }
);


export default api; 