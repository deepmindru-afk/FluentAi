# FluentAi Setup Guide

## Overview
FluentAi is a real-time chat application with AI integration using LiveKit for real-time communication, Clerk for authentication, and mem0 for conversation memory.

## Prerequisites
- Node.js 18+ 
- Python 3.8+
- Clerk account
- LiveKit Cloud account or self-hosted LiveKit server
- Groq API key
- Mem0 API key

## Client Setup

### 1. Install Dependencies
```bash
cd client
npm install @clerk/nextjs
npm uninstall next-auth  # Remove old auth system
```

### 2. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# LiveKit Configuration  
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 3. Clerk Setup
1. Create a Clerk application at https://clerk.com
2. Configure sign-in/sign-up methods (email, Google, etc.)
3. Copy your publishable and secret keys to `.env.local`

## Server Setup

### 1. Install Dependencies
```bash
cd server
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the server directory:

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# AI Configuration
GROQ_API_KEY=your-groq-api-key
MEM0_API_KEY=your-mem0-api-key
```

### 3. LiveKit Setup
1. Sign up at https://livekit.io or set up your own server
2. Create a project and get your API keys
3. Configure your server URL

## Running the Application

### 1. Start the Backend
```bash
cd server
python app/main.py
```

### 2. Start the Frontend
```bash
cd client
npm run dev
```

### 3. Access the Application
Open http://localhost:3000 in your browser

## Features

### Authentication
- Clerk-based authentication with multiple sign-in methods
- Secure user management and session handling
- Custom styled authentication components

### Room Management
- Create and delete chat rooms
- View all active rooms
- Join rooms with prefilled names from room list
- Real-time participant management

### Chat Features
- Real-time messaging with LiveKit
- AI responses powered by Groq LLM
- Conversation memory with mem0
- Auto-scroll to latest messages
- Shift+Enter for new lines in messages
- Scroll-to-bottom button when scrolled up

### Participants Management
- View participants in each room
- Remove participants from rooms
- Move participants between rooms
- Real-time participant updates

## Architecture

### Frontend (Next.js 14 + App Router)
- **Authentication**: Clerk for user management
- **Real-time**: LiveKit React components
- **UI**: Tailwind CSS + Radix UI components
- **State Management**: React hooks

### Backend (Python Flask)
- **Real-time**: LiveKit Python SDK
- **AI**: Groq API for LLM responses
- **Memory**: Mem0 for conversation context
- **API**: RESTful endpoints for room/participant management

### Key Components
- `ChatRoom`: Main chat interface with LiveKit integration
- `RoomManagement`: Admin interface for room operations
- `ParticipantsManagement`: Participant administration
- `RoomJoin`: Join rooms with Clerk user integration

## Troubleshooting

### Common Issues
1. **Clerk errors**: Ensure you've installed `@clerk/nextjs` and removed `next-auth`
2. **LiveKit connection issues**: Check your server URL and API keys
3. **Memory not working**: Verify mem0 API key and user ID consistency
4. **CORS errors**: Ensure backend CORS is configured for your frontend URL

### Development Tips
- Use browser dev tools to check network requests
- Check server logs for mem0 and LiveKit API errors
- Verify environment variables are loaded correctly
- Test authentication flow in incognito mode

## Migration from NextJS Auth

The application has been migrated from NextJS Auth to Clerk. Key changes:
- Removed `auth.ts`, `auth.config.ts`, and related files
- Updated middleware to use `clerkMiddleware`
- Replaced session management with Clerk's user system
- Updated all auth-protected routes to use Clerk's `auth()` function

## Next Steps
1. Configure your Clerk application settings
2. Set up your LiveKit server
3. Get API keys for Groq and mem0
4. Customize the UI to match your brand
5. Deploy to your preferred hosting platform
