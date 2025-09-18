import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
AGENT_NAME = os.getenv("AGENT_NAME", "python-agent")
MEM0_API_KEY = os.getenv("MEM0_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")