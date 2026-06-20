import api from './api';

const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/upload/image', formData);
    return data.data;
  },

  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const { data } = await api.post('/upload/images', formData);
    return data.data;
  },

  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    const { data } = await api.post('/upload/document', formData);
    return data.data;
  },

  uploadVideo: async (file) => {
    const formData = new FormData();
    formData.append('video', file);
    const { data } = await api.post('/upload/video', formData);
    return data.data;
  },

  uploadAudio: async (file) => {
    const formData = new FormData();
    formData.append('audio', file);
    const { data } = await api.post('/upload/audio', formData);
    return data.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/upload/avatar', formData);
    return data.data;
  },

  deleteFile: async (publicId) => {
    const { data } = await api.delete(`/upload/${publicId}`);
    return data;
  },

  deleteFiles: async (publicIds) => {
    const { data } = await api.post('/upload/delete-multiple', { publicIds });
    return data;
  },
};

export default uploadService;
