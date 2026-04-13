import { getSupabaseBrowserClient } from './supabase-browser';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'lead' | 'schedule' | 'followup' | 'system';
  title: string;
  description: string;
  read: boolean;
  action_url: string | null;
  action_text: string | null;
  extra_data: Record<string, any> | null;
  created_at: string;
}

export interface UnreadCount {
  unread_count: number;
  by_type: Record<string, number>;
}

export interface CreateNotificationPayload {
  user_id: string;
  type: string;
  title: string;
  description: string;
  action_url?: string | null;
  action_text?: string | null;
  extra_data?: Record<string, any> | null;
}

export interface MarkReadPayload {
  notification_ids?: string[] | null;
}

class NotificationAPI {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }

  async listNotifications(
    typeFilter?: string,
    unreadOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const headers = await this.getAuthHeaders();
    
    const params = new URLSearchParams();
    if (typeFilter) params.append('type_filter', typeFilter);
    params.append('unread_only', String(unreadOnly));
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    
    const response = await fetch(
      `${API_BASE}/api/v1/notifications?${params.toString()}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    return response.json();
  }

  async getUnreadCount(): Promise<UnreadCount> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}/api/v1/notifications/unread-count`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch unread count: ${response.statusText}`);
    }

    return response.json();
  }

  async markAsRead(notificationIds?: string[] | null): Promise<{ marked_read: number }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}/api/v1/notifications/mark-read`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        notification_ids: notificationIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notifications as read: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.statusText}`);
    }
  }

  async createNotification(payload: CreateNotificationPayload): Promise<Notification> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}/api/v1/notifications`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create notification: ${error}`);
    }

    return response.json();
  }
}

export const notificationAPI = new NotificationAPI();
