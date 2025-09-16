# app/main.py
import asyncio
from flask import Flask, request, jsonify
from services.livekit_api_service import *

app = Flask(__name__)

@app.route('/getToken', methods=['POST'])
def get_token_route():
    """API endpoint to generate and return a LiveKit access token."""
    data = request.get_json()
    room_name = data.get('roomName')
    identity = data.get('identity')

    if not room_name or not identity:
        return jsonify({"error": "roomName and identity are required."}), 400

    token = asyncio.run(generate_token(room_name, identity))
    return jsonify({"token": token})

@app.route('/createRoom', methods=['POST'])
def create_room_route():
    """API endpoint to create a LiveKit room."""
    data = request.get_json()
    room_name = data.get('roomName')

    if not room_name:
        return jsonify({"error": "roomName is required."}), 400

    room_info = asyncio.run(create_room(room_name))
    # Convert Room message to dictionary and then to JSON
    room_dict = {
        'name': room_info.name,
        'sid': room_info.sid,
    }
    return jsonify(room_dict)

@app.route('/listRooms', methods=['GET'])
def list_rooms_route():
    """API endpoint to list all active rooms."""
    rooms = asyncio.run(list_rooms())
    return jsonify({"rooms": rooms})

@app.route('/deleteRoom', methods=['POST'])
def delete_room_route():
    """API endpoint to delete a room."""
    data = request.get_json()
    room_name = data.get('roomName')
    if not room_name:
        return jsonify({"error": "roomName is required."}), 400

    result = asyncio.run(delete_room(room_name))
    return jsonify(result)

@app.route('/listParticipants', methods=['POST'])
def list_participants_route():
    """API endpoint to list participants in a room."""
    data = request.get_json()
    room_name = data.get('roomName')
    if not room_name:
        return jsonify({"error": "roomName is required."}), 400

    participants = asyncio.run(list_participants(room_name))
    return jsonify({"participants": participants})

@app.route('/removeParticipant', methods=['POST'])
def remove_participant_route():
    """API endpoint to remove a participant from a room."""
    data = request.get_json()
    room_name = data.get('roomName')
    identity = data.get('identity')
    if not room_name or not identity:
        return jsonify({"error": "roomName and identity are required."}), 400

    result = asyncio.run(remove_participant(room_name, identity))
    return jsonify(result)

@app.route('/muteTrack', methods=['POST'])
def mute_track_route():
    """API endpoint to mute/unmute a participant's track."""
    data = request.get_json()
    room_name = data.get('roomName')
    identity = data.get('identity')
    track_sid = data.get('trackSid')
    muted = data.get('muted')

    if not all([room_name, identity, track_sid, muted is not None]):
        return jsonify({"error": "roomName, identity, trackSid, and muted are required."}), 400

    result = asyncio.run(mute_track(room_name, identity, track_sid, muted))
    return jsonify(result)

@app.route('/updateParticipant', methods=['POST'])
def update_participant_route():
    """API endpoint to update a participant's permissions or metadata."""
    data = request.get_json()
    room_name = data.get('roomName')
    identity = data.get('identity')
    metadata = data.get('metadata')
    permissions = data.get('permissions')

    if not all([room_name, identity]):
        return jsonify({"error": "roomName and identity are required."}), 400

    result = asyncio.run(update_participant(room_name, identity, metadata, permissions))
    return jsonify(result)

@app.route('/moveParticipant', methods=['POST'])
def move_participant_route():
    """API endpoint to move a participant to another room."""
    data = request.get_json()
    room_name = data.get('roomName')
    identity = data.get('identity')
    destination_room_name = data.get('destinationRoomName')

    if not all([room_name, identity, destination_room_name]):
        return jsonify({"error": "roomName, identity, and destinationRoomName are required."}), 400

    result = asyncio.run(move_participant(room_name, identity, destination_room_name))
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)