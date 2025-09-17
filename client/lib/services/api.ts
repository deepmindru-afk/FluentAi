// API service to communicate with Python backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface CreateRoomRequest {
  roomName: string;
}

export interface GetTokenRequest {
  roomName: string;
  identity: string;
}

export interface RoomInfo {
  name: string;
  sid: string;
}

export interface TokenResponse {
  token: string;
}

export interface ChatResponse {
  response: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createRoom(roomName: string): Promise<ApiResponse<RoomInfo>> {
    console.log('Creating room:', roomName);
    return this.request<RoomInfo>('/createRoom', {
      method: 'POST',
      body: JSON.stringify({ roomName }),
    });
  }

  async getToken(roomName: string, identity: string): Promise<ApiResponse<TokenResponse>> {
    console.log('Getting token for room:', roomName, 'identity:', identity);
    return this.request<TokenResponse>('/getToken', {
      method: 'POST',
      body: JSON.stringify({ roomName, identity }),
    });
  }

  async listRooms(): Promise<ApiResponse<{ rooms: RoomInfo[] }>> {
    console.log('Listing rooms');
    return this.request<{ rooms: RoomInfo[] }>('/listRooms');
  }

  async deleteRoom(roomName: string): Promise<ApiResponse<any>> {
    console.log('Deleting room:', roomName);
    return this.request('/deleteRoom', {
      method: 'POST',
      body: JSON.stringify({ roomName }),
    });
  }

  async listParticipants(roomName: string): Promise<ApiResponse<{ participants: any[] }>> {
    console.log('Listing participants for room:', roomName);
    return this.request<{ participants: any[] }>('/listParticipants', {
      method: 'POST',
      body: JSON.stringify({ roomName }),
    });
  }

  async removeParticipant(roomName: string, identity: string): Promise<ApiResponse<any>> {
    console.log('Removing participant:', identity, 'from room:', roomName);
    return this.request('/removeParticipant', {
      method: 'POST',
      body: JSON.stringify({ roomName, identity }),
    });
  }

  async sendMessage(roomName: string, username: string, message: string, chatMessages: any[]): Promise<ApiResponse<ChatResponse>> {
    console.log('Sending message:', message, 'to room:', roomName, 'from user:', username);
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ roomName, username, message, chatMessages }),
    });
  }
}

export const apiService = new ApiService();
