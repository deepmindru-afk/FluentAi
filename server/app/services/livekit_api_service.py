# app/services/livekit_api_service.py
import os
from livekit import api
from livekit.api import CreateRoomRequest, VideoGrants, AccessToken

# Load environment variables from a .env file
# (This is a good practice to keep your keys out of your code)
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
API_KEY = os.getenv("LIVEKIT_API_KEY")
API_SECRET = os.getenv("LIVEKIT_API_SECRET")

async def generate_token(room_name: str, identity: str) -> str:
    """Generates an access token for a given participant to join a room."""
    # The with_grants() method is the correct way to set permissions.
    token = (
        AccessToken(API_KEY, API_SECRET)
        .with_identity(identity)
        .with_grants(VideoGrants(room_join=True, room=room_name))
        .to_jwt()
    )
    return token

async def create_room(room_name: str):
    """Creates a new room with specified name."""
    async with api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET) as lkapi:
        # Use a `CreateRoomRequest` object to specify room options
        room_info = await lkapi.room.create_room(CreateRoomRequest(
            name=room_name,
            empty_timeout=10 * 60,  # 10 minutes
            max_participants=20
        ))
    return room_info
