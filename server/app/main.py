# app/main.py
import asyncio
from flask import Flask, request, jsonify
from config import LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
from services.livekit_api_service import generate_token, create_room

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
    return jsonify({
        "room_name": room_info.name,
        "room_sid": room_info.sid
    })

# Add other routes for listing, deleting, etc. rooms later.

if __name__ == '__main__':
    app.run(debug=True)