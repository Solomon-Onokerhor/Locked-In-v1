import os
import asyncio
import random
import time
from datetime import datetime
from fastapi import FastAPI, Request, BackgroundTasks
from database import init_db, set_human_takeover, is_human_takeover_active
from ai_agent import process_message, COMMANDER_LID
from scheduler import start_scheduler
from echo_tracker import register_bot_sent, is_bot_echo
import requests
from dotenv import load_dotenv

load_dotenv(override=True)

app = FastAPI()

# Initialize DB and scheduler on startup
@app.on_event("startup")
def on_startup():
    init_db()
    start_scheduler()
    print("Python Brain is online.")

@app.post("/webhook")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    sender = payload.get("sender")
    chat = payload.get("chat")
    is_from_me = payload.get("is_from_me", False)
    is_group = payload.get("is_group", False)
    is_newsletter = payload.get("is_newsletter", False)
    message = payload.get("message", "")
    audio_path = payload.get("audio_path", "")
    push_name = payload.get("push_name", "")
    
    print(f"Received message from {sender} (Chat: {chat}, IsFromMe: {is_from_me}, Group: {is_group}, Newsletter: {is_newsletter}, PushName: {push_name}): {message}")

    # Handle in background so WhatsApp doesn't time out
    background_tasks.add_task(handle_message, sender, chat, is_from_me, is_group, is_newsletter, message, audio_path, push_name)
    return {"status": "ok"}

@app.post("/send_lead_message")
async def send_lead_message(request: Request):
    """Called by the Next.js lead capture form to instantly send the Arsenal PDF via WhatsApp."""
    try:
        payload = await request.json()
        recipient = payload.get("recipient", "").strip()
        message = payload.get("message", "").strip()

        if not recipient or not message:
            return {"status": "error", "detail": "recipient and message are required"}

        from tools import normalize_number
        from echo_tracker import register_bot_sent
        clean = normalize_number(recipient)
        jid = f"{clean}@s.whatsapp.net"

        register_bot_sent(jid, message)
        resp = requests.post(
            "http://127.0.0.1:3000/send",
            json={"recipient": clean, "text": message},
            timeout=10
        )
        if resp.status_code == 200:
            print(f"[Lead Delivery] Sent Arsenal PDF message to {clean}")
            return {"status": "ok"}
        else:
            print(f"[Lead Delivery] Send failed: {resp.status_code}")
            return {"status": "error", "detail": f"Connector returned {resp.status_code}"}
    except Exception as e:
        print(f"[Lead Delivery] Error: {e}")
        return {"status": "error", "detail": str(e)}

def process_locked_in_event(event_type: str, table: str, record: dict):
    """Background task to handle Supabase DB events and send WhatsApp notifications."""
    from supabase_client import get_supabase
    import requests
    from tools import normalize_number
    
    supabase = get_supabase()
    if not supabase:
        print("Webhook Error: Supabase client not initialized.")
        return
        
    msg = ""
    
    # 1. New Room Notification
    if table == "rooms" and event_type == "INSERT":
        title = record.get("title", "New Room")
        room_type = record.get("room_type", "Study") # 'Study' or 'Skill'
        faculty = record.get("faculty", "General")
        is_private = record.get("is_private", False)
        
        if is_private:
            return
            
        emoji = "🧠" if room_type == "Skill" else "📚"
        msg = f"{emoji} *New {room_type} Room Alert!*\n\nA new {faculty} {room_type.lower()} room '{title}' was just created on Locked-In! Jump in now to build your streak."
        
    # 2. New Resource Notification
    elif table == "resources" and event_type == "INSERT":
        title = record.get("title", "New Resource")
        r_type = record.get("resource_type", "Document")
        desc = record.get("description", "")
        
        msg = f"📂 *New Free Resource Added!*\n\n*{title}* ({r_type})\n{desc}\n\nLog into Locked-In to download and review it."
        
    if not msg:
        return
        
    try:
        # MVP: Broadcast to everyone with a number. Later, filter by matching faculty/tags.
        response = supabase.table("profiles").select("whatsapp_number").not_is_null("whatsapp_number").execute()
        users = response.data
        for user in users:
            num = user.get("whatsapp_number")
            if num:
                clean_num = normalize_number(num)
                requests.post(
                    "http://127.0.0.1:3000/send",
                    json={"recipient": clean_num, "text": msg},
                    timeout=5
                )
        print(f"Webhook: Notification sent to {len(users)} users for {table}.")
    except Exception as e:
        print(f"Webhook Error processing {table}: {e}")

@app.post("/locked-in-webhook")
async def receive_locked_in_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receives Database Webhooks directly from Supabase."""
    try:
        payload = await request.json()
        event_type = payload.get("type")
        table = payload.get("table")
        record = payload.get("record", {})
        
        print(f"Received Locked-In Webhook: {event_type} on {table}")
        
        background_tasks.add_task(process_locked_in_event, event_type, table, record)
        return {"status": "received"}
    except Exception as e:
        print(f"Failed to parse webhook: {e}")
        return {"error": str(e)}

async def keep_typing(sender: str, stop_event: asyncio.Event):
    """Continuously refresh the typing indicator every 3s until stop_event is set."""
    try:
        while not stop_event.is_set():
            try:
                await asyncio.to_thread(
                    requests.post,
                    "http://localhost:3000/typing",
                    json={"recipient": sender, "text": ""}
                )
            except Exception:
                pass
            # WhatsApp typing indicator lasts ~5s, refresh every 3s to keep it alive
            await asyncio.sleep(3)
    except asyncio.CancelledError:
        pass


async def handle_message(sender: str, chat: str, is_from_me: bool, is_group: bool, is_newsletter: bool, message: str, audio_path: str = "", push_name: str = ""):
    # Transcribe audio if present
    if audio_path and os.path.exists(audio_path):
        print(f"Voice Note received from {sender}. Transcribing {audio_path}...")
        from ai_agent import transcribe_audio
        try:
            transcription = await asyncio.to_thread(transcribe_audio, audio_path)
            message = f"[Voice Note]: {transcription}" if transcription else "[Voice Note: Could not detect speech]"
            print(f"Transcription complete: {message}")
            try:
                os.remove(audio_path)
            except OSError as e:
                print(f"Could not delete audio file {audio_path}: {e}")
        except Exception as e:
            print(f"Error during transcription: {e}")
            message = "[Error transcribing voice note]"

    # If it's a group or newsletter, just ignore it completely
    if is_group or is_newsletter:
        print(f"Ignoring background noise from {chat} (Group/Newsletter).")
        return

    # All outgoing messages (is_from_me=True) are handled here
    if is_from_me:
        # If this is the bot's own echo bouncing back from Go — skip entirely.
        if is_bot_echo(chat, message):
            print(f"[Echo] Bot echo detected for {chat}, ignoring.")
            return

        # If Solomon is messaging his own number (Commander talking to the bot),
        # let it through to AI processing instead of dropping it.
        if chat == sender:
            print(f"[Commander] Solomon messaging self — passing to AI.")
            # Fall through to AI processing below
        else:
            # Solomon manually replied to someone else — activate/extend takeover.
            # Use a shorter 10-minute window that auto-extends with each reply.
            print(f"[Human Takeover] Solomon manually replied to {chat}. Muting bot for 10 mins (auto-extends on each reply).")
            
            # Check if this is a NEW takeover (first manual reply) vs extension
            was_already_active = is_human_takeover_active(chat)
            set_human_takeover(chat, minutes=10)
            
            if not was_already_active:
                # Notify Commander that takeover is active
                auth_sender = os.getenv("AUTHORIZED_SENDER", "")
                if auth_sender:
                    recipient = auth_sender if "@" in auth_sender else f"{auth_sender}@s.whatsapp.net"
                    notify_text = f"🔇 *Takeover activated* for this chat. Bot is muted for 10 min (auto-extends as you keep replying). Say \"stand down\" to end it early."
                    try:
                        requests.post("http://localhost:3000/send", json={"recipient": recipient, "text": notify_text}, timeout=5)
                    except Exception:
                        pass
            
            from database import save_conversation_message
            save_conversation_message(sender=chat, role="assistant", content=message)
            return  # Don't process outgoing replies to others through AI

    # Check DB for active Human Takeover (persists across restarts)
    if is_human_takeover_active(chat):
        print(f"[Human Takeover] Active for {chat}. Silently saving message without AI reply.")
        from database import save_conversation_message
        save_conversation_message(sender=sender, role="user", content=message)
        return

    authorized = os.getenv("AUTHORIZED_SENDER", "")
    is_commander = (authorized and authorized in sender) or (COMMANDER_LID in sender)

    # [NO-REPLY MODE] Disable AI auto-replies for normal users.
    if not is_commander:
        print(f"[No-Reply Mode] Received message from {sender}. Bot replies are currently disabled.")
        from database import save_conversation_message
        save_conversation_message(sender=sender, role="user", content=message)
        return

    # Start typing indicator loop in the background
    stop_typing = asyncio.Event()
    typing_task = asyncio.ensure_future(keep_typing(sender, stop_typing))

    # Process through AI Agent in a thread pool (non-blocking for concurrent users)
    try:
        reply_text = await asyncio.to_thread(process_message, message, sender, push_name)
    except Exception as e:
        # Give Solomon the raw error; give contacts a warm, human-sounding fallback
        if is_commander:
            reply_text = f"System Error: {str(e)}"
        else:
            reply_text = "I'm having a moment — I'll get back to you shortly."
        print(f"[Error] process_message failed for {sender}: {e}")
    finally:
        # Stop the typing indicator loop
        stop_typing.set()
        typing_task.cancel()

    # Human-like delay before sending:
    # - No delay for Commander (instant)
    # - Short delay for contacts (looks like a human typing)
    if is_commander:
        delay = 0
    else:
        base = random.uniform(1.0, 2.5)
        length_factor = min(len(reply_text) / 300, 2.0)  # max extra 2s
        delay = base + length_factor

    if delay > 0:
        print(f"Waiting {delay:.1f}s before sending reply...")
        await asyncio.sleep(delay)

    # RACE CONDITION GUARD: Re-check takeover right before sending.
    # If Solomon started replying manually while the AI was thinking, drop the bot's reply.
    if not is_commander and is_human_takeover_active(chat):
        print(f"[Human Takeover] Solomon took over {chat} while AI was processing. Dropping bot reply.")
        return

    # Pass the AI reply through without forced blockquote formatting
    formatted_reply = reply_text.strip()

    # Send reply back via Go Connector
    # If the Commander is messaging themselves, WhatsApp doesn't always sync messages sent to @lid back to the phone UI.
    # Force the recipient to be the standard @s.whatsapp.net number.
    target_recipient = chat if chat else sender
    if is_commander:
        auth_sender = os.getenv("AUTHORIZED_SENDER", "")
        if auth_sender:
            target_recipient = auth_sender if "@" in auth_sender else f"{auth_sender}@s.whatsapp.net"

    # Register this send so the echo that bounces back from Go is identified and skipped.
    register_bot_sent(target_recipient, formatted_reply)

    send_payload = {
        "recipient": target_recipient,
        "text": formatted_reply
    }
    try:
        requests.post("http://localhost:3000/send", json=send_payload)
        print("Reply sent to WhatsApp.")
    except Exception as e:
        print("Failed to send reply to Go Connector:", e)

if __name__ == "__main__":
    import uvicorn
    print("Starting Locked-In AI OS...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
