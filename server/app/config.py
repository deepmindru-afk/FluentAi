import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

LIVEKIT_URL = os.getenv("LIVEKIT_URL")
API_KEY = os.getenv("LIVEKIT_API_KEY")
API_SECRET = os.getenv("LIVEKIT_API_SECRET")
ROOM_NAME = os.getenv("ROOM_NAME", "test-room")
AGENT_NAME = os.getenv("AGENT_NAME", "python-agent")

