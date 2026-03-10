let memoryToken = null;

export const getToken = () => {
  if (!memoryToken) {
    memoryToken = prompt('Enter Heady API Key / Admin Token:') || 'default_insecure_token';
  }
  return memoryToken;
};
