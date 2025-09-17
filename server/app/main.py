# app/main.py
import asyncio
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from mem0 import MemoryClient
from config import *
from services.livekit_api_service import *

app = Flask(__name__)
CORS(app)

# Initialize Groq client
groq_client = Groq(
    api_key=GROQ_API_KEY
)

# # Initialize Mem0
# mem0 = MemoryClient(
#     api_key=os.environ.get("MEM0_API_KEY"),
# )

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


@app.route('/chat', methods=['POST'])
def chat_route():
    """API endpoint to handle chat messages and generate AI responses."""
    data = request.get_json()
    message = data.get('message')
    username = data.get('username')
    room_name = data.get('roomName')
    chat_messages = data.get('chatMessages' , [])

    if not all([message, username, room_name]):
        return jsonify({"error": "message, username, and roomName are required."}), 400

    try:
        # Retrieve conversation history from mem0
        # history = mem0.get_history(user_id=username)

        # Prepare messages for Groq API
        messages = [
            {
                "role": "system",
                "content": "You are a helpful AI assistant. Use the conversation history to provide context-aware responses."
            }
        ]
        for entry in chat_messages:
            messages.append({"role": entry["role"], "content": entry["content"]})
        
        messages.append({"role": "user", "content": message})

        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant"
        )

        ai_response = chat_completion.choices[0].message.content

        # Save the new interaction to mem0
        # mem0.add(data=f"User: {message}\nAI: {ai_response}", user_id=username)

        return jsonify({"response": ai_response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)