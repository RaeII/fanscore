import api from '../lib/api';

const getQuestsByScope = async (scope) => {
  const response = await api.get(`/quest/scope/${scope}`);
  return response.data?.content || null;
};

export default {
  getQuestsByScope,
}; 