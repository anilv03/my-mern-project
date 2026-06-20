import api from './api';

const contentService = {
  getLibrary: async (params = {}) => {
    const { data } = await api.get('/content/library', { params });
    return data;
  },

  getCourses: async () => {
    const { data } = await api.get('/content/courses');
    return data.data;
  },

  getCourseDetail: async (productId) => {
    const { data } = await api.get(`/content/courses/${productId}`);
    return data.data;
  },

  getAudioBooks: async () => {
    const { data } = await api.get('/content/audio');
    return data.data;
  },

  getAudioBookDetail: async (productId) => {
    const { data } = await api.get(`/content/audio/${productId}`);
    return data.data;
  },

  getSubscriptionDetail: async () => {
    const { data } = await api.get('/content/subscription');
    return data.data;
  },

  downloadContent: async (productId) => {
    const { data } = await api.post(`/content/download/${productId}`);
    return data.data;
  },

  getDownloadHistory: async (productId) => {
    const { data } = await api.get(`/content/download-history/${productId}`);
    return data.data;
  },

  updateCourseProgress: async (productId, progressData) => {
    const { data } = await api.patch(`/content/progress/course/${productId}`, progressData);
    return data.data;
  },

  updateAudioProgress: async (productId, progressData) => {
    const { data } = await api.patch(`/content/progress/audio/${productId}`, progressData);
    return data.data;
  },

  getSignedUrl: async (productId, videoIndex) => {
    const params = videoIndex !== undefined ? { videoIndex } : {};
    const { data } = await api.get(`/content/signed-url/${productId}`, { params });
    return data.data;
  },

  renewSubscription: async (subscriptionId) => {
    const { data } = await api.post(`/content/subscription/${subscriptionId}/renew`);
    return data.data;
  },

  buyAgain: async (productId) => {
    const { data } = await api.post(`/content/buy-again/${productId}`);
    return data.data;
  },
};

export default contentService;
