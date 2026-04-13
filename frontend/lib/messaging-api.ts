import { getSupabaseBrowserClient } from './supabase-browser';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  name: string;
  email: string | null;
}

export interface ConversationParticipant {
  user_id: string;
  conversation_id: string;
  joined_at: string;
  last_read_at: string | null;
  user_profile: UserProfile | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  extra_metadata: Record<string, any> | null;
  participants: ConversationParticipant[];
}

export interface ConversationWithLastMessage extends Conversation {
  last_message: Message | null;
  unread_count: number;
}

export interface MessageIn {
  content: string;
}

export interface ConversationIn {
  other_user_id: string;
}

export interface UnreadCountOut {
  unread_count: number;
}

class MessagingAPI {
  // Cache for conversations list
  private conversationsCache: {
    data: ConversationWithLastMessage[];
    timestamp: number;
  } | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds

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

  async listConversations(limit: number = 50, useCache: boolean = true): Promise<ConversationWithLastMessage[]> {
    // Check cache if enabled
    if (useCache && this.conversationsCache) {
      const age = Date.now() - this.conversationsCache.timestamp;
      if (age < this.CACHE_TTL) {
        console.log(`Using cached conversations (age: ${Math.round(age / 1000)}s)`);
        return this.conversationsCache.data;
      }
    }

    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}/api/v1/messaging/conversations?limit=${limit}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Update cache
    this.conversationsCache = {
      data,
      timestamp: Date.now(),
    };

    return data;
  }

  // Clear cache (useful when sending a new message)
  clearCache(): void {
    this.conversationsCache = null;
  }

  async createConversation(otherUserId: string): Promise<Conversation> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}/api/v1/messaging/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ other_user_id: otherUserId }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create conversation: ${error}`);
    }

    return response.json();
  }

  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE}/api/v1/messaging/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    return response.json();
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE}/api/v1/messaging/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send message: ${error}`);
    }

    return response.json();
  }

  async markConversationRead(conversationId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE}/api/v1/messaging/conversations/${conversationId}/read`,
      {
        method: 'POST',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark conversation as read: ${response.statusText}`);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}/api/v1/messaging/messages/${messageId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.statusText}`);
    }
  }

  async getUnreadCount(conversationId: string): Promise<number> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE}/api/v1/messaging/conversations/${conversationId}/unread`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to get unread count: ${response.statusText}`);
    }

    const data: UnreadCountOut = await response.json();
    return data.unread_count;
  }
}

export const messagingAPI = new MessagingAPI();
