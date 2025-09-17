# app/services/livekit_api_service.py
import os
import json
from livekit import api
from livekit.api import (
    CreateRoomRequest,
    DeleteRoomRequest,
    ListRoomsRequest,
    ListParticipantsRequest,
    RoomParticipantIdentity,
    UpdateParticipantRequest,
    MuteRoomTrackRequest,
    MoveParticipantRequest,
    VideoGrants,
    AccessToken,
)

LIVEKIT_URL = os.getenv("LIVEKIT_URL")
API_KEY = os.getenv("LIVEKIT_API_KEY")
API_SECRET = os.getenv("LIVEKIT_API_SECRET")

async def generate_token(room_name: str, identity: str) -> str:
    """Generates an access token for a given participant to join a room."""
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

async def list_rooms():
    """Lists all active rooms.
    
    Returns:
        list: A list of dictionaries containing room information
    """
    async with api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET) as lkapi:
        response = await lkapi.room.list_rooms(ListRoomsRequest())
        
        # Convert protobuf Room objects to dictionaries
        rooms_list = []
        for room in response.rooms:
            room_dict = {
                'sid': room.sid,
                'name': room.name,
                'empty_timeout': room.empty_timeout,
                'creation_time': room.creation_time,
                'max_participants': room.max_participants,
                'num_participants': room.num_participants,
            }
            rooms_list.append(room_dict)
            
        return rooms_list

async def delete_room(room_name: str):
    """Deletes a room and disconnects all participants."""
    async with api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET) as lkapi:
        await lkapi.room.delete_room(DeleteRoomRequest(room=room_name))
        return {"status": "success", "message": f"Room '{room_name}' deleted."}

async def list_participants(room_name: str):
    """Lists all participants in a given room."""
    async with api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET) as lkapi:
        participants = await lkapi.room.list_participants(ListParticipantsRequest(room=room_name))
        return [json.loads(p.json()) for p in participants.participants]

async def get_participant(room_name: str, identity: str):
    """Gets details for a specific participant."""
    async with api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET) as lkapi:
        participant = await lkapi.room.get_participant(RoomParticipantIdentity(room=room_name, identity=identity))
        return json.loads(participant.json())

async def update_participant(room_name: str, identity: str, metadata: dict = None, permissions: dict = None):
    """Updates a participant's metadata and/or permissions."""
    async with api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET) as lkapi:
        update_request = UpdateParticipantRequest(
            room=room_name,
            identity=identity
        )

        if metadata:
            update_request.metadata = json.dumps(metadata)
        if permissions:
            update_request.permission = api.ParticipantPermission(**permissions)

        participant = await lkapi.room.update_participant(update_request)
        return json.loads(participant.json())

async def remove_participant(room_name: str, identity: str):
    """Removes a participant from a room."""
    async with api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET) as lkapi:
        await lkapi.room.remove_participant(RoomParticipantIdentity(room=room_name, identity=identity))
        return {"status": "success", "message": f"Participant '{identity}' removed from room '{room_name}'."}

async def mute_track(room_name: str, identity: str, track_sid: str, muted: bool):
    """Mutes or unmutes a participant's track."""
    async with api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET) as lkapi:
        await lkapi.room.mute_published_track(MuteRoomTrackRequest(
            room=room_name,
            identity=identity,
            track_sid=track_sid,
            muted=muted
        ))
        return {"status": "success", "message": f"Track '{track_sid}' for participant '{identity}' muted: {muted}"}

async def move_participant(room_name: str, identity: str, destination_room_name: str):
    """Moves a participant to another room."""
    async with api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET) as lkapi:
        await lkapi.room.move_participant(MoveParticipantRequest(
            room=room_name,
            identity=identity,
            destination_room=destination_room_name
        ))
        return {"status": "success", "message": f"Participant '{identity}' moved from '{room_name}' to '{destination_room_name}'."}