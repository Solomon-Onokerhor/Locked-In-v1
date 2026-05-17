import time
import requests
from apscheduler.schedulers.background import BackgroundScheduler

from datetime import datetime
from zoneinfo import ZoneInfo
from collections import defaultdict
import os
from dotenv import load_dotenv
from echo_tracker import register_bot_sent
from datetime import timezone

load_dotenv(override=True)
# The WhatsApp number that should receive the scheduled reminders (e.g., 1234567890)
AUTHORIZED_SENDER = os.getenv("AUTHORIZED_SENDER", "")

# Track the last time we polled the database for new events
last_polled = datetime.now(timezone.utc).isoformat()

def poll_locked_in_database():
    global last_polled
    from main import process_locked_in_event
    from supabase_client import get_supabase
    
    supabase = get_supabase()
    if not supabase:
        return
        
    current_poll_time = datetime.now(timezone.utc).isoformat()
    
    try:
        # Check Rooms
        res_rooms = supabase.table("rooms").select("*").gt("created_at", last_polled).execute()
        if res_rooms.data:
            for room in res_rooms.data:
                print(f"[Polling] Detected new room: {room.get('title')}")
                process_locked_in_event("INSERT", "rooms", room)
                
        # Check Resources
        res_resources = supabase.table("resources").select("*").gt("created_at", last_polled).execute()
        if res_resources.data:
            for res in res_resources.data:
                print(f"[Polling] Detected new resource: {res.get('title')}")
                process_locked_in_event("INSERT", "resources", res)
                
        last_polled = current_poll_time
    except Exception as e:
        print(f"Database Polling Error: {e}")

def start_scheduler():
    tz = ZoneInfo("Africa/Accra")
    scheduler = BackgroundScheduler(timezone=tz)
    scheduler.add_job(poll_locked_in_database, 'interval', seconds=30) # Poll DB for new events every 30s
    scheduler.start()
    return scheduler

if __name__ == "__main__":
    start_scheduler()
    try:
        while True:
            time.sleep(2)
    except (KeyboardInterrupt, SystemExit):
        pass
