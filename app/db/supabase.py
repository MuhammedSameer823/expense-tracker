import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load variables
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key or "your-project-id" in supabase_url or "your-supabase" in supabase_key:
    print("\n\033[93mWARNING: Supabase URL or Key is missing/configured with placeholders. Please update your .env file.\033[0m\n")
    # Fallback to prevent immediate crash during initialization checks
    supabase_url = supabase_url or "https://placeholder.supabase.co"
    supabase_key = supabase_key or "placeholder"

try:
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as e:
    print(f"\033[91mError initializing Supabase client: {e}\033[0m")
    sys.exit(1)
