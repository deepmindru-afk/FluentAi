import asyncio
from app.services import livekit_agent

async def main():
    try:
        await livekit_agent.start_agent()
        # Keep the application running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down agent...")
        await livekit_agent.stop_agent()
    except Exception as e:
        print(f"Error: {e}")
        await livekit_agent.stop_agent()

if __name__ == "__main__":
    asyncio.run(main())