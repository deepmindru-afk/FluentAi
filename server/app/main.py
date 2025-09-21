# app/main.py
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from groq import Groq
#from mem0 import MemoryClient

from app.config import *
from app.services.livekit_api_service import *
import concurrent.futures

app = Flask(__name__)
CORS(app)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)


# Rate limit error handler
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429

# Initialize Groq client
groq_client = Groq(
    api_key=GROQ_API_KEY
)
'''
if MEM0_API_KEY and MEMO_ORG_ID and MEMO_PROJECT_ID:
    try:
        mem0 = MemoryClient(api_key=MEM0_API_KEY)
        print(f"Mem0 client initialized successfully")
    except Exception as e:
        print(f"Failed to initialize Mem0 client: {e}")
        mem0 = None
else:
    print("Missing Mem0 environment variables")
    mem0 = None
'''
mem0=None
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

@app.route('/checkUsername', methods=['POST'])
def check_username_route():
    """API endpoint to check if username is available in a room."""
    data = request.get_json()
    room_name = data.get('roomName')
    username = data.get('username')
    
    if not room_name or not username:
        return jsonify({"error": "roomName and username are required."}), 400
    
    try:
        # Get current participants in the room
        participants = asyncio.run(list_participants(room_name))
        
        # Check if username is already taken
        for participant in participants:
            if participant.get('identity') == username:
                return jsonify({"available": False, "message": "Username is already taken in this room"})
        
        return jsonify({"available": True, "message": "Username is available"})
        
    except Exception as e:
        # If room doesn't exist, username is available
        return jsonify({"available": True, "message": "Username is available"})


@app.route('/joinRoom', methods=['POST'])
def join_room_route():
    """API endpoint to handle user joining a room and AI agent greeting."""
    data = request.get_json()
    room_name = data.get('roomName')
    username = data.get('username')
    
    if not all([room_name, username]):
        return jsonify({"error": "roomName and username are required."}), 400
    
    try:
        # Create room if it doesn't exist
        create_result = asyncio.run(create_room(room_name))
        
        # Check if this user has previous context in this room
        user_room_id = f"{username}_{room_name}"
        greeting_message = f"Hello! Welcome to {room_name}."
        
        if mem0:
            try:
                # Search for previous interactions in this room
                room_memories = mem0.search(
                    query="conversation history",
                    version="v2",
                    filters={"AND": [{"user_id": user_room_id}]},
                    limit=3
                )
                if room_memories and len(room_memories) > 0:
                    greeting_message = f"Welcome back to {room_name}! I remember our previous conversations. How can I help you today?"
                else:
                    # Check for general user memories
                    user_memories = mem0.search(
                        query="user preferences",
                        version="v2",
                        filters={"AND": [{"user_id": username}]},
                        limit=2
                    )
                    if user_memories and len(user_memories) > 0:
                        greeting_message = f"Hello! Welcome to {room_name}. I remember you from our previous chats. How can I assist you today?"
                
            except Exception as mem_error:
                print(f"Memory retrieval error during greeting: {mem_error}")
        
        return jsonify({
            "success": True,
            "greeting": greeting_message,
            "room": {
                "name": create_result.name,
                "sid": create_result.sid
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# @app.route('/chat', methods=['POST'])
# @limiter.limit("10 per minute")
# def chat_route():
#     """API endpoint to handle chat messages and generate AI responses."""
#     data = request.get_json()
#     message = data.get('message')
#     username = data.get('username')
#     room_name = data.get('roomName')
#     chat_messages = data.get('chatMessages', [])

#     if not all([message, username, room_name]):
#         return jsonify({"error": "message, username, and roomName are required."}), 400

#     try:
#         user_room_id = f"{username}_{room_name}"
#         memory_context = []

#         if mem0:
#             try:
#                 # Search for room-specific memories
#                 query = message
#                 room_memory_context = mem0.search(
#                     query=query,
#                     version="v2",
#                     filters={"AND": [{"user_id": user_room_id}]},
#                     limit=5
#                 )
#                 # Search for user memories
#                 user_memory_context = mem0.search(
#                     query=query,
#                     version="v2",
#                     filters={"AND": [{"user_id": username}]},
#                     limit=5
#                 )
                
#                 # Combine both contexts
#                 memory_context = room_memory_context + user_memory_context
#                 print(f"Retrieved {len(room_memory_context)} room memories and {len(user_memory_context)} user memories for {username} in {room_name}")

#             except Exception as mem_error:
#                 print(f"Memory retrieval error: {mem_error}")
#                 memory_context = []
#         else:
#             print("Mem0 client not available, proceeding without memory context")

#         # Prepare messages for Groq API with memory context
#         messages = [
#             {
#                 "role": "system",
#                 "content": "You are a helpful AI assistant. Use the provided context to give personalized, context-aware responses."
#             }
#         ]

#         # Add memory context if available
#         if memory_context and len(memory_context) > 0:
#             print("First memory:", memory_context[0])  # Inspect the structure
#             sorted_memories = sorted(memory_context, key=lambda x: x.get('score', 0), reverse=True)
#             memory_texts = []
#             for mem in sorted_memories[:5]:
#                 print("Memory:", mem)  # Inspect each memory
#                 if mem.get('memory') and mem.get('score', 0) > 0.5:
#                     memory_texts.append(f"Previous Conversation: {mem['memory']}")
#             if memory_texts:
#                 memory_text = "\n\n".join(memory_texts)
#                 messages.append({
#                     "role": "user",
#                     "content": f"Relevant context from previous conversations:\n{memory_text}"
#                 })
#             else:
#                 print("No memories met the relevance threshold.")

#         # Add recent chat history (limit to last 10 messages to avoid token limits)
#         recent_messages = chat_messages[-10:] if len(chat_messages) > 10 else chat_messages
#         for entry in recent_messages:
#             messages.append({"role": entry["role"], "content": entry["content"]})

#         messages.append({"role": "user", "content": message})

#         chat_completion = groq_client.chat.completions.create(
#             messages=messages,
#             model="llama-3.1-8b-instant"
#         )

#         ai_response = chat_completion.choices[0].message.content

#         conversation_history = [
#             {"role": "user", "content": message},
#             {"role": "assistant", "content": ai_response}
#         ]
#         # Save the new interaction to mem0
#         if mem0:
#             try:
#                 room_messages = conversation_history.copy()
#                 # Debug: Print the data being sent to Mem0
#                 print("Data being sent to Mem0:")
#                 print("conversation_history:", conversation_history)
#                 print("user_room_id:", user_room_id)

#                 # Save to room-specific memory
#                 mem0.add(
#                     room_messages,
#                     user_id=user_room_id,
#                     version="v2"
#                 )

#                 # Save to general user memory
#                 general_messages = conversation_history.copy()
#                 mem0.add(
#                     general_messages,
#                     user_id=username,
#                     version="v2"
#                 )

#                 print(f"Successfully stored conversation to memory for user {username} in room {room_name}")
                
#             except Exception as mem_error:
#                 print(f"Memory storage error: {mem_error}")
#                 import traceback
#                 print(f"Traceback: {traceback.format_exc()}")
#         else:
#             print("Mem0 client not available, skipping memory storage")

#         return jsonify({"response": ai_response}), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

def run_async(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    if loop.is_running():
        return asyncio.run(coro)  # fallback
    return loop.run_until_complete(coro)

# Helper: fetch room + user memories in parallel
def fetch_memories(message, user_room_id, username):
    results = []
    if not mem0:
        return results

    with concurrent.futures.ThreadPoolExecutor() as executor:
        query = message
        futures = [
            executor.submit(mem0.search, query, version="v2", filters={"AND": [{"user_id": user_room_id}]}, limit=5),
            executor.submit(mem0.search, query, version="v2", filters={"AND": [{"user_id": username}]}, limit=5)
        ]
        for f in futures:
            try:
                res = f.result()
                if res:
                    results.extend(res)
                    print(f"Retrieved {len(res)} memories for {username} in {user_room_id}")
            except Exception as e:
                print(f"Memory fetch error: {e}")
    return results

@app.route('/chat', methods=['POST'])
@limiter.limit("10 per minute")
def chat_route():
    """Optimized API endpoint for chat messages."""
    data = request.get_json()
    message = data.get('message')
    username = data.get('username')
    room_name = data.get('roomName')
    chat_messages = data.get('chatMessages', [])

    if not all([message, username, room_name]):
        return jsonify({"error": "message, username, and roomName are required."}), 400

    try:
        conversation_history = [
            {"role": "user", "content": message},
            #{"role": "assistant", "content": ai_response}
        ]
        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant"
        )
        ai_response = chat_completion.choices[0].message.content
        return jsonify({"response": ai_response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    '''
        try:
            user_room_id = f"{username}_{room_name}"

            # 1. Fetch memories in parallel
            memory_context = fetch_memories(message, user_room_id, username)

            # 2. Prepare system + memory messages
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant. Use provided context to give personalized responses."
                }
            ]

            if memory_context:
                sorted_memories = sorted(memory_context, key=lambda x: x.get('score', 0), reverse=True)
                memory_texts = [
                    f"Previous Conversation: {mem['memory']}"
                    for mem in sorted_memories[:3]
                    if mem.get('memory') and mem.get('score', 0) > 0.7
                ]
                if memory_texts:
                    messages.append({
                        "role": "user",
                        "content": "Relevant context:\n" + "\n\n".join(memory_texts)
                    })
            # 3. Add last 5 turns of chat (10 messages max)
            recent_messages = chat_messages[-10:]
            messages.extend(recent_messages)
            messages.append({"role": "user", "content": message})
            print(f"Messages: {messages}")  

            # 4. Call Groq
            chat_completion = groq_client.chat.completions.create(
                messages=messages,
                model="llama-3.1-8b-instant"
            )
            ai_response = chat_completion.choices[0].message.content

            # 5. Save interaction asynchronously
            conversation_history = [
                {"role": "user", "content": message},
                {"role": "assistant", "content": ai_response}
            ]
            if mem0:
                try:
                    mem0.add(conversation_history, user_id=user_room_id, version="v2")
                    mem0.add(conversation_history, user_id=username, version="v2")
                    print(f"✅ Stored memories immediately for {username} in {user_room_id}")
                except Exception as e:
                    print(f"❌ Memory storage error: {e}")

            return jsonify({"response": ai_response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    '''


if __name__ == '__main__':
    app.run(debug=True)