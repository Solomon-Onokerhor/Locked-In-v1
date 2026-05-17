import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(override=True)

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

# We initialize a global client to be imported by other files
supabase_db: Client | None = None

if url and key:
    try:
        supabase_db = create_client(url, key)
        print("Connected to Locked-In Supabase successfully.")
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
else:
    print("Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in .env")

def get_supabase() -> Client | None:
    """Returns the initialized Supabase client."""
    return supabase_db
