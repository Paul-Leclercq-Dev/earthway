import api from './api';

export const userService = {
  getMe: () => api.get('/users/me').then((r) => r.data),
  updateMe: (data: {
    firstName?: string;
    lastName?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    photoUrl?: string;
  }) => api.put('/users/me', data).then((r) => r.data),
};
