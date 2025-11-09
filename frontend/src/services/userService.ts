import api from './api';

export const userService = {
  /**
   * Approve a pending user
   */
  async approveUser(userId: string): Promise<void> {
    await api.post(`/users/${userId}/approve`);
  },

  /**
   * Reject a pending user
   */
  async rejectUser(userId: string): Promise<void> {
    await api.post(`/users/${userId}/reject`);
  },
};
