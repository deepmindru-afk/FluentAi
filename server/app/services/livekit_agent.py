import asyncio
import os
from dotenv import load_dotenv
from livekit import rtc, api

# Load environment variables from config.py
load_dotenv()

# Global variables
room = None
_task = None

async def start_agent():
    """Start the LiveKit agent and join the room."""
    global room, _task
    if room is not None:
        print("Agent already running.")
        return

    room = rtc.Room()

    @room.on("connected")
    def on_connected():
        print(f"{os.getenv('AGENT_NAME')} connected to room: {os.getenv('ROOM_NAME')}")

    @room.on("data_received")
    def on_data(data: bytes, participant: rtc.RemoteParticipant, kind: rtc.DataPacketKind):
        msg = data.decode("utf-8")
        print(f"Received: {msg} from {participant.identity}")
        asyncio.create_task(room.local_participant.publish_data(f"Echo: {msg}".encode("utf-8")))

    async def connect():
        token = api.AccessToken(os.getenv("LIVEKIT_API_KEY"), os.getenv("LIVEKIT_API_SECRET")) \
            .with_identity(os.getenv("AGENT_NAME")) \
            .with_grants(api.VideoGrants(room_join=True, room=os.getenv("ROOM_NAME"))) \
            .to_jwt()

        await room.connect(os.getenv("LIVEKIT_URL"), token)
        # Remove the blocking line: await asyncio.Future()

    _task = asyncio.create_task(connect())

async def stop_agent():
    """Disconnect the agent from the room."""
    global room, _task
    if room:
        await room.disconnect()
        room = None
    if _task:
        _task.cancel()
        _task = None

# Example of how to use the functions
async def main():
    print("Starting agent...")
    await start_agent()
    # Let the agent run for a bit, then stop it
    await asyncio.sleep(20)
    print("Stopping agent...")
    await stop_agent()

if __name__ == "__main__":
    asyncio.run(main())