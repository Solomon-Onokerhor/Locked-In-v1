import os
import json
import requests
import threading
import time
import random
from dotenv import load_dotenv
from database import SessionLocal, Contact
from datetime import datetime
from echo_tracker import register_bot_sent
from supabase_client import get_supabase

load_dotenv(override=True)


# CONTACT TOOLS
# ─────────────────────────────────────────────

def normalize_number(phone: str) -> str:
    """Normalize a phone number to international format."""
    clean = "".join(filter(str.isdigit, phone))
    if clean.startswith("0") and len(clean) == 10:
        clean = "233" + clean[1:]
    return clean

def save_contact(name: str, phone_number: str, relationship: str = None) -> str:
    """Save a contact's name and phone number for future use."""
    db = SessionLocal()
    clean_number = normalize_number(phone_number)
    existing = db.query(Contact).filter(Contact.name.ilike(name)).first()
    if existing:
        existing.phone_number = clean_number
        if relationship:
            existing.relationship = relationship
        db.commit()
        db.close()
        return f"Updated contact: {name} → {clean_number}"
    contact = Contact(name=name, phone_number=clean_number, relationship=relationship)
    db.add(contact)
    db.commit()
    db.close()
    return f"Contact saved: {name} → {clean_number}"

def update_contact_relationship(name: str, relationship: str) -> str:
    """Save or update the relationship status of an existing contact."""
    db = SessionLocal()
    contact = db.query(Contact).filter(Contact.name.ilike(f"%{name}%")).first()
    if contact:
        contact.relationship = relationship
        db.commit()
        db.close()
        return f"Updated relationship for {contact.name}: {relationship}"
    db.close()
    return f"No contact found with name '{name}'. Please save the contact first."

def find_contact(name: str) -> str:
    """Look up a contact's phone number by name."""
    db = SessionLocal()
    contact = db.query(Contact).filter(Contact.name.ilike(f"%{name}%")).first()
    db.close()
    if not contact:
        return f"No contact found with name '{name}'."
    return f"{contact.name}: {contact.phone_number}"

# ─────────────────────────────────────────────
# MESSAGING TOOLS
# ─────────────────────────────────────────────

def _format_whatsapp(message: str) -> str:
    """Pass a message through without forced formatting."""
    return message.strip()

def send_whatsapp_message(recipient_name_or_number: str, message: str) -> str:
    """Send a WhatsApp message to a contact on Solomon's behalf."""
    db = SessionLocal()
    contact = db.query(Contact).filter(Contact.name.ilike(f"%{recipient_name_or_number}%")).first()
    db.close()

    if contact:
        phone = contact.phone_number
        display = contact.name
    else:
        phone = normalize_number(recipient_name_or_number)
        display = phone

    formatted_message = _format_whatsapp(message)

    try:
        # Register BEFORE sending so the Go echo is caught immediately
        register_bot_sent(f"{phone}@s.whatsapp.net", formatted_message)

        resp = requests.post(
            "http://127.0.0.1:3000/send",
            json={"recipient": phone, "text": formatted_message},
            timeout=10
        )
        if resp.status_code == 200:
            return f"Message sent to {display}: '{message}'"
        else:
            return f"Failed to send message (status {resp.status_code})."
    except Exception as e:
        return f"Error sending message: {str(e)}"


# ─────────────────────────────────────────────
# LOCKED-IN PLATFORM TOOLS
# ─────────────────────────────────────────────

def _run_campaign_background(message_template: str):
    supabase = get_supabase()
    if not supabase:
        print("Campaign failed: Supabase client not initialized.")
        return

    try:
        # Fetch users with whatsapp numbers
        response = supabase.table("profiles").select("name, whatsapp_number").neq("whatsapp_number", "null").execute()
        users = response.data
    except Exception as e:
        print(f"Campaign failed: Error fetching users: {e}")
        return

    if not users:
        print("Campaign finished: No users found with WhatsApp numbers.")
        return

    count = 0
    for user in users:
        number = user.get("whatsapp_number")
        name = user.get("name", "Student")
        if not number:
            continue

        # Format message
        msg = message_template.replace("{name}", name)
        
        # Send message
        try:
            clean_number = normalize_number(number)
            
            register_bot_sent(f"{clean_number}@s.whatsapp.net", msg)
            resp = requests.post(
                "http://127.0.0.1:3000/send",
                json={"recipient": clean_number, "text": msg},
                timeout=10
            )
            if resp.status_code == 200:
                count += 1
                print(f"Campaign: Sent to {name} ({clean_number})")
            else:
                print(f"Campaign: Failed to send to {clean_number} (Status: {resp.status_code})")
        except Exception as e:
            print(f"Campaign: Error sending to {number}: {e}")
        
        # Interval delay 5-8 seconds
        delay = random.uniform(5.0, 8.0)
        time.sleep(delay)

    print(f"Campaign complete. Successfully sent to {count} users.")


def launch_campaign(message_template: str) -> str:
    """Launch a broadcast campaign to all Locked-In users with a registered WhatsApp number."""
    supabase = get_supabase()
    if not supabase:
        return "Error: Supabase client is not initialized. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY."

    try:
        # Just do a quick count first to report back
        response = supabase.table("profiles").select("id", count="exact").neq("whatsapp_number", "null").execute()
        total_users = response.count
    except Exception as e:
        return f"Error connecting to Supabase: {e}"

    if not total_users or total_users == 0:
        return "No users found with a registered WhatsApp number."

    # Start background thread
    threading.Thread(target=_run_campaign_background, args=(message_template,), daemon=True).start()

    estimated_time = total_users * 6.5 / 60  # average 6.5s per message
    return f"Campaign started for {total_users} users. Estimated completion time: {estimated_time:.1f} minutes. The messages will be sent in the background with a 5-8 second delay between each."

# ─────────────────────────────────────────────
# HUMAN TAKEOVER TOOLS
# ─────────────────────────────────────────────

def take_over_chat(contact_name_or_number: str, minutes: int = 30) -> str:
    """Manually activate human takeover for a contact's chat. Bot will go silent."""
    from database import set_human_takeover
    db = SessionLocal()
    contact = db.query(Contact).filter(Contact.name.ilike(f"%{contact_name_or_number}%")).first()
    db.close()

    if contact:
        chat_jid = f"{contact.phone_number}@s.whatsapp.net"
        display = contact.name
    else:
        phone = normalize_number(contact_name_or_number)
        chat_jid = f"{phone}@s.whatsapp.net"
        display = phone

    set_human_takeover(chat_jid, minutes=minutes)
    return f"Takeover activated for *{display}*. Bot is muted for {minutes} minutes on that chat."

def stand_down(contact_name_or_number: str) -> str:
    """End human takeover and let the bot resume handling a contact's chat."""
    from database import SessionLocal as SL, HumanTakeover
    db = SL()
    
    # Try to find by contact name first
    contact = db.query(Contact).filter(Contact.name.ilike(f"%{contact_name_or_number}%")).first()
    
    if contact:
        chat_jid = f"{contact.phone_number}@s.whatsapp.net"
        display = contact.name
    else:
        phone = normalize_number(contact_name_or_number)
        chat_jid = f"{phone}@s.whatsapp.net"
        display = phone

    record = db.query(HumanTakeover).filter(HumanTakeover.chat_jid == chat_jid).first()
    if record:
        db.delete(record)
        db.commit()
        db.close()
        return f"Takeover ended for *{display}*. Bot is back online for that chat."
    
    db.close()
    return f"No active takeover found for {display}."



# ─────────────────────────────────────────────
# TOOL SCHEMAS — COMMANDER (full access)
# ─────────────────────────────────────────────

tools_schema = [
    {
        "type": "function",
        "function": {
            "name": "save_contact",
            "description": "Save a person's name and WhatsApp phone number to the contacts list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "The contact's name."},
                    "phone_number": {"type": "string", "description": "The contact's phone number with country code, e.g. 233XXXXXXXXX."},
                    "relationship": {"type": "string", "description": "Optional. The contact's relationship to Solomon, e.g. 'student', 'client'."}
                },
                "required": ["name", "phone_number"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_contact_relationship",
            "description": "Save or update the relationship status of an existing contact.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "The contact's name."},
                    "relationship": {"type": "string", "description": "The contact's relationship to Solomon."}
                },
                "required": ["name", "relationship"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_contact",
            "description": "Look up a contact's phone number by their name before sending them a message.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "The name of the contact to look up."}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_whatsapp_message",
            "description": "Send a WhatsApp message to a contact on Solomon's behalf. Uses contact name (if saved) or raw phone number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipient_name_or_number": {"type": "string", "description": "The contact name or phone number to send the message to."},
                    "message": {"type": "string", "description": "The message text to send."}
                },
                "required": ["recipient_name_or_number", "message"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "launch_campaign",
            "description": "Launch a broadcast campaign to all Locked-In users who have a registered WhatsApp number. Use {name} in the message template to personalize it.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message_template": {"type": "string", "description": "The message template to send. Use {name} to insert the user's name."}
                },
                "required": ["message_template"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "take_over_chat",
            "description": "Manually mute the bot for a specific contact's chat so Solomon can handle it personally. The bot will stop replying to that contact.",
            "parameters": {
                "type": "object",
                "properties": {
                    "contact_name_or_number": {"type": "string", "description": "The contact name or phone number to take over."},
                    "minutes": {"type": "integer", "description": "How many minutes to mute the bot for. Default 30."}
                },
                "required": ["contact_name_or_number"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "stand_down",
            "description": "End human takeover for a contact's chat. The bot will resume handling their messages.",
            "parameters": {
                "type": "object",
                "properties": {
                    "contact_name_or_number": {"type": "string", "description": "The contact name or phone number to release."}
                },
                "required": ["contact_name_or_number"]
            }
        }
    }
]

# ─────────────────────────────────────────────
# TOOL DISPATCHER — maps name → function
# ─────────────────────────────────────────────

tool_functions = {
    "save_contact": save_contact,
    "find_contact": find_contact,
    "send_whatsapp_message": send_whatsapp_message,
    "update_contact_relationship": update_contact_relationship,
    "launch_campaign": launch_campaign,
    "take_over_chat": take_over_chat,
    "stand_down": stand_down,
}

# ─────────────────────────────────────────────
# TOOL SCHEMAS — SECRETARY (restricted access)
# ─────────────────────────────────────────────

secretary_tools_schema = [
    t for t in tools_schema
    if t["function"]["name"] in {
        "save_contact",
    }
]
