import apiClient from './api';

export interface CallLog {
  id: string;
  contactId: string;
  userId: string;
  tenantId: string;
  duration: number;
  callType: 'AUDIO' | 'VIDEO';
  status: 'COMPLETED' | 'MISSED' | 'FAILED';
  direction: 'INBOUND' | 'OUTBOUND';
  roomName?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateCallLogData {
  contactId: string;
  duration: number;
  callType?: 'AUDIO' | 'VIDEO';
  status?: 'COMPLETED' | 'MISSED' | 'FAILED';
  direction?: 'INBOUND' | 'OUTBOUND';
  roomName?: string;
  notes?: string;
}

export const callService = {
  /**
   * Create a call log
   */
  async createCallLog(data: CreateCallLogData): Promise<CallLog> {
    const response = await apiClient.post('/calls', data);
    return response.data.data;
  },

  /**
   * Get call history for a contact
   */
  async getCallHistoryForContact(contactId: string, limit = 50): Promise<CallLog[]> {
    const response = await apiClient.get(`/calls/contact/${contactId}`, {
      params: { limit },
    });
    return response.data.data;
  },

  /**
   * Get call statistics
   */
  async getCallStats(startDate?: Date, endDate?: Date): Promise<{
    totalCalls: number;
    totalMinutes: number;
    totalHours: number;
  }> {
    const response = await apiClient.get('/calls/stats', {
      params: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
    });
    return response.data.data;
  },

  /**
   * Get recent calls for user
   */
  async getRecentCalls(limit = 10): Promise<CallLog[]> {
    const response = await apiClient.get('/calls/recent', {
      params: { limit },
    });
    return response.data.data;
  },
};
