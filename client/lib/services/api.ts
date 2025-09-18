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
  num_participants?: number;
  creation_time?: number;
  max_participants?: number;
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

  async moveParticipant(roomName: string, identity: string, destinationRoomName: string): Promise<ApiResponse<any>> {
    console.log('Moving participant:', identity, 'from room:', roomName, 'to room:', destinationRoomName);
    return this.request('/moveParticipant', {
      method: 'POST',
      body: JSON.stringify({ roomName, identity, destinationRoomName }),
    });
  }

  async updateParticipant(roomName: string, identity: string, metadata?: any, permissions?: any): Promise<ApiResponse<any>> {
    console.log('Updating participant:', identity, 'in room:', roomName);
    return this.request('/updateParticipant', {
      method: 'POST',
      body: JSON.stringify({ roomName, identity, metadata, permissions }),
    });
  }

  async muteTrack(roomName: string, identity: string, trackSid: string, muted: boolean): Promise<ApiResponse<any>> {
    console.log('Muting track:', trackSid, 'for participant:', identity, 'in room:', roomName, 'muted:', muted);
    return this.request('/muteTrack', {
      method: 'POST',
      body: JSON.stringify({ roomName, identity, trackSid, muted }),
    });
  }

  async checkUsername(roomName: string, username: string): Promise<ApiResponse<{ available: boolean; message: string }>> {
    console.log('Checking username availability:', username, 'in room:', roomName);
    return this.request<{ available: boolean; message: string }>('/checkUsername', {
      method: 'POST',
      body: JSON.stringify({ roomName, username }),
    });
  }

  async joinRoom(roomName: string, username: string): Promise<ApiResponse<{ success: boolean; greeting: string; room: any }>> {
    console.log('Joining room:', roomName, 'with username:', username);
    return this.request<{ success: boolean; greeting: string; room: any }>('/joinRoom', {
      method: 'POST',
      body: JSON.stringify({ roomName, username }),
    });
  }
}

export const apiService = new ApiService();
