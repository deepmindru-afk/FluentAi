# FluentAI - Intelligent Chat Application

A modern, full-stack chat application with AI integration, real-time communication, and persistent memory using Clerk, LiveKit, Groq, and Mem0.

## Features

### 🔐 Authentication
- **Google OAuth Integration**: Seamless sign-in with Google accounts
- **Email/Password Authentication**: Traditional credential-based login
- **Clerk**: Latest authentication framework with session management

### 💬 Real-time Chat
- **LiveKit Integration**: Real-time messaging with WebRTC
- **AI-Powered Responses**: Intelligent responses using Groq's LLM
- **Persistent Memory**: Context-aware conversations with Mem0
- **Modern UI**: Beautiful, responsive chat interface with message differentiation

### 🏠 Room Management
- **Create/Join Rooms**: Dynamic room creation and management
- **Participant Management**: Add/remove participants from rooms
- **Room Listing**: Browse all active chat rooms
- **Real-time Updates**: Live participant and room status updates

### 🧠 Memory & Context
- **Contextual Conversations**: AI remembers previous interactions
- **User-specific Memory**: Personalized responses based on chat history
- **Memory Retrieval**: Smart context injection for relevant responses
- **Room-Specific Context**: The specific room holds the context of the user. Even if you leave and join again, it holds the context and all the memories. New chat interactions are saved back into the memory store for continuous improvement.

## Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Clerk**: Authentication
- **LiveKit React**: Real-time communication components
- **Lucide React**: Modern icon library

### Backend
- **Python Flask**: Lightweight web framework
- **Groq**: Fast LLM inference
- **Mem0**: Memory and context management
- **LiveKit Server SDK**: Real-time communication backend

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.8+
- Clerk account
- LiveKit Cloud account or self-hosted LiveKit server
- Groq API key
- Mem0 API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FluentAi
```

### 2. Frontend Setup
```bash
cd client
npm install
# or
pnpm install
```

Copy the environment template and configure:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_BASE_URL=https://fluentai-h2hq.onrender.com
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server-url
```

### 3. Backend Setup
```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Copy the environment template and configure:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
GROQ_API_KEY=your-groq-api-key
MEM0_API_KEY=your-mem0-api-key
MEMO_ORG_ID=your-mem0-org-id
MEMO_PROJECT_ID=your-mem0-project-id
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_URL=wss://your-livekit-server-url
```

### 4. Run the Application

Start the backend server:
```bash
cd server
venv\Scripts\activate
python app/main.py
```

Start the frontend development server:
```bash
cd client
npm run dev
# or
pnpm dev
```

Visit `http://localhost:3000` to access the application.

## Usage

### 1. Authentication
- Visit the application and click "Continue with Google" or use email/password
- Complete the authentication flow

### 2. Create or Join Rooms
- Navigate to "Rooms" to see active rooms
- Click "Create New Room" to start a new conversation
- Join existing rooms by clicking "Join Room"

### 3. Chat with AI
- Send messages in any room
- AI will respond with contextual, memory-aware replies
- Previous conversations are remembered for personalized responses

### 4. Manage Participants
- Click the users icon next to any room to manage participants
- Remove participants or view room activity

## Memory System

The application uses Mem0 for persistent memory:
- **User Context**: Each user has their own memory space
- **Conversation History**: Previous interactions are stored and retrieved
- **Smart Retrieval**: Relevant context is injected into AI responses
- **Personalization**: Responses become more personalized over time

## Deployment

### Live Deployment

✅ **Frontend**: 
- **URL**: [https://fluentai.vercel.app/](https://fluentai.vercel.app/)

✅ **Backend**:
- **URL**: [https://fluentai-h2hq.onrender.com/](https://fluentai-h2hq.onrender.com/)


### Deployment Instructions

#### Frontend Deployment (Vercel)
```bash
cd client
vercel --prod
```

#### Backend Deployment (Vercel)
```bash
cd server
vercel --prod
```

## Future Plans

- **Upcoming Participant Management**: The room will remember the individual context of two separate users, allowing multiple people to chat in the room at the same time.
- **Speech-to-Text/Text-to-Speech**: The system will be extended with speech-to-text or text-to-speech services.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the setup instructions

---

Built with ❤️ using Next.js, Flask, and modern AI technologies.
A real-time, memory-enhanced AI chat agent. Using LiveKit for seamless chat and a RAG system like mem0 to provide contextual, personalized conversations that remember past interactions.
