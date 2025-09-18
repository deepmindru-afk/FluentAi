# app/main.py
import asyncio
import os
from sys import version
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

# Initialize Mem0
os.environ["MEM0_API_KEY"] = MEM0_API_KEY
mem0 = MemoryClient()

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
        # Create a unique user identifier that includes room context
        user_room_id = f"{username}_{room_name}"
        
        # Retrieve conversation history from mem0
        try:
            # Search for both room-specific and general user memories
            query = message
            
            # First, try to get room-specific memories
            room_filters = {
                "AND": [
                    {
                        "user_id": user_room_id
                    }
                ]
            }
            room_memory_context = mem0.search(query=query, version="v2", filters=room_filters, limit=5)
            
            # Also get general user memories
            user_filters = {
                "AND": [
                    {
                        "user_id": username
                    }
                ]
            }
            user_memory_context = mem0.search(query=query, version="v2", filters=user_filters, limit=3)
            
            # Combine both contexts
            memory_context = room_memory_context + user_memory_context
            print(f"Retrieved {len(room_memory_context)} room memories and {len(user_memory_context)} user memories for {username} in {room_name}")
            
        except Exception as mem_error:
            print(f"Memory retrieval error: {mem_error}")
            memory_context = []

        # Prepare messages for Groq API with memory context
        system_content = "You are a helpful AI assistant. Use the conversation history and memory context to provide personalized, context-aware responses."
        
        # Add memory context to system message if available
        if memory_context:
            # Sort memories by relevance score if available
            sorted_memories = sorted(memory_context, key=lambda x: x.get('score', 0), reverse=True)
            memory_texts = []
            
            for mem in sorted_memories[:5]:  # Limit to top 5 most relevant memories
                if mem.get('text'):
                    memory_texts.append(mem['text'])
            
            if memory_texts:
                memory_text = "\n".join(memory_texts)
                system_content += f"\n\nRelevant conversation history and context:\n{memory_text}"

        messages = [
            {
                "role": "system",
                "content": system_content
            }
        ]
        
        # Add recent chat history (limit to last 10 messages to avoid token limits)
        recent_messages = chat_messages[-10:] if len(chat_messages) > 10 else chat_messages
        for entry in recent_messages:
            messages.append({"role": entry["role"], "content": entry["content"]})
        
        messages.append({"role": "user", "content": message})

        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant"
        )

        ai_response = chat_completion.choices[0].message.content

        # Save the new interaction to mem0 with both room-specific and general user context
        try:
            interaction_data = f"In room '{room_name}' - User ({username}): {message}\nAI Assistant: {ai_response}"
            
            # Save to room-specific memory
            mem0.add(data=interaction_data, user_id=user_room_id)
            print(f"Saved room-specific interaction to memory for user {username} in room {room_name}")
            
            # Also save a general version for cross-room context
            general_data = f"User ({username}): {message}\nAI Assistant: {ai_response}"
            mem0.add(data=general_data, user_id=username)
            print(f"Saved general interaction to memory for user {username}")
            
        except Exception as mem_error:
            print(f"Memory storage error: {mem_error}")

        return jsonify({"response": ai_response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)