import api from "../lib/api";

const getEstablishmentById = async (id) => {
  const response = await api.get(`/establishment/${id}`);
  return response.data.content;
};

const getEstablishments = async () => {
  const response = await api.get(`/establishment`);
  return response.data.content;
};

export default {
  getEstablishmentById,
  getEstablishments
};
