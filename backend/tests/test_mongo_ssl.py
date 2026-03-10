import asyncio
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from dotenv import load_dotenv

# Add project root to path for imports
root = Path(__file__).resolve().parent
sys.path.append(str(root))
_env_path = root / ".." / ".env"
load_dotenv(dotenv_path=_env_path)

MONGODB_URI = os.getenv("MONGODB_URI")
print(f"Testing connection to: {MONGODB_URI[:20]}...")

async def test_conn():
    # Attempt to extract shard addresses from the error log or standard Atlas pattern
    shards = [
        "cluster0-shard-00-00.si4ld.mongodb.net:27017",
        "cluster0-shard-00-01.si4ld.mongodb.net:27017",
        "cluster0-shard-00-02.si4ld.mongodb.net:27017"
    ]
    
    print("\n--- Diagnostic 1: Raw SSL Handshake (Python ssl module) ---")
    import ssl
    import socket
    for addr in shards:
        host, port = addr.split(":")
        try:
            context = ssl.create_default_context(cafile=certifi.where())
            with socket.create_connection((host, int(port)), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=host) as ssock:
                    print(f"✅ Raw SSL handshake success with {host} ({ssock.version()})")
        except Exception as e:
            print(f"❌ Raw SSL handshake failed with {host}: {e}")

    print("\n--- Diagnostic 2: Client with explicit TLS version (Async) ---")
    try:
        # Try forcing TLS 1.2
        client4 = AsyncIOMotorClient(
            MONGODB_URI,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=5000
        )
        print("Attempting ping with AsyncIOMotorClient...")
        await client4.admin.command('ping')
        print("✅ Async Connection successful!")
    except Exception as e:
        print(f"❌ Async Connection failed: {e}")

    print("\n--- Diagnostic 3: Direct Non-SRV connection string (Simplified) ---")
    # Convert srv to standard mongodb://
    # Note: We don't know the exact RS name, but cluster0-shard-0 is common.
    # We substitute Marcus:marcus placeholder
    base_uri = MONGODB_URI.replace("mongodb+srv://", "mongodb://")
    if "/?" in base_uri:
        std_uri = base_uri.replace("cluster0.si4ld.mongodb.net", ",".join(shards))
    else:
        std_uri = base_uri.replace("cluster0.si4ld.mongodb.net/", ",".join(shards) + "/?ssl=true")

    try:
        from pymongo import MongoClient
        client_std = MongoClient(std_uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        print(f"Attempting ping with standard URI: {std_uri[:50]}...")
        client_std.admin.command('ping')
        print("✅ Standard URI Connection successful!")
    except Exception as e:
        print(f"❌ Standard URI Connection failed: {e}")

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        import warnings
        warnings.filterwarnings("ignore", category=DeprecationWarning)
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        except: pass
    asyncio.run(test_conn())
