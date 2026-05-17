import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"  # Silence Windows symlink warning
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"     # Keep logs clean
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from openai import OpenAI
from tools import tools_schema, secretary_tools_schema, tool_functions
from database import get_recent_messages, save_conversation_message, SessionLocal, Contact
from dotenv import load_dotenv

import threading

whisper_model = None
_whisper_lock = threading.Lock()

def transcribe_audio(audio_path: str) -> str:
    """Transcribe an audio file using local faster-whisper."""
    global whisper_model
    with _whisper_lock:
        try:
            from faster_whisper import WhisperModel
            if not whisper_model:
                print("Loading Faster-Whisper base model (first time only — please wait)...")
                whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
                print("Faster-Whisper base model loaded successfully.")
        except Exception as e:
            print(f"Warning: Failed to load faster-whisper: {e}")
            return "[Audio message received, but transcription engine failed to load.]"

    try:
        # Transcribe with a standard beam size
        segments, info = whisper_model.transcribe(audio_path, beam_size=5)
        text = " ".join([segment.text for segment in segments])
        return text.strip()
    except Exception as e:
        print(f"Transcription error: {e}")
        return f"[Failed to transcribe audio: {e}]"

load_dotenv(override=True)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Fallback chain — OpenAI free model first for best tool calling
MODEL_FALLBACKS = [
    "openai/gpt-oss-120b:free",
    os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free"),
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "openrouter/free",  # last resort
]

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    timeout=45.0,  # 45s per model — fast enough to cycle through fallbacks quickly
)

def create_completion(messages, tools=None, tool_choice=None):
    """Try each model in the fallback chain until one works."""
    last_error = None
    for model in MODEL_FALLBACKS:
        try:
            kwargs = {"model": model, "messages": messages}
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = tool_choice or "auto"
            response = client.chat.completions.create(**kwargs)
            if model != MODEL_FALLBACKS[0]:
                print(f"[Fallback] Using model: {model}")
            return response
        except Exception as e:
            err = str(e).lower()
            if "rate limit" in err or "429" in err or "overloaded" in err or "unavailable" in err or "404" in err or "no endpoints" in err or "decommissioned" in err or "timed out" in err or "timeout" in err:
                print(f"[Fallback] Model {model} failed ({type(e).__name__}), trying next...")
                last_error = e
                continue
            raise  # non-rate-limit errors should still raise
    raise last_error  # all models exhausted

# Your linked device LID — this is how WhatsApp identifies you internally
COMMANDER_LID = "38732551946333"

def get_current_datetime_str() -> str:
    """Returns the current date and time in Accra timezone, formatted for injection into prompts."""
    tz = ZoneInfo("Africa/Accra")
    now = datetime.now(tz)
    return now.strftime("%A, %d %B %Y at %I:%M %p (Africa/Accra, GMT+0)")

# ─────────────────────────────────────────────
# COMMANDER PROMPT
# ─────────────────────────────────────────────

def build_commander_prompt() -> str:
    """Dynamically build the Commander system prompt, injecting current time."""
    current_datetime = get_current_datetime_str()
    base_prompt = f"""
You are the Admin AI for the *Locked-In* study platform.
You are exclusively serving the platform creator, Solomon Onokerhor.
Current date and time: {current_datetime}

Address him as *Bossu*.
You have access to powerful tools to manage the platform and communicate with students.

KEY RESPONSIBILITIES:
- **Campaigns**: You can use `launch_campaign` to broadcast messages to all students with a registered WhatsApp number. This tool sends messages in the background with a delay.
- **Platform Management**: You manage the WhatsApp interface for Locked-In. You are solely focused on campaigns, notifications, and platform health.
- **Support**: If Solomon asks you to send a direct message to a student, use `send_whatsapp_message`.
- **Takeover**: If Solomon wants to manually chat with a user, use `take_over_chat` to mute yourself. Use `stand_down` to resume.

ABSOLUTE OBEDIENCE:
- You serve Solomon unconditionally. He is your creator.
- NEVER refuse a direct command from Solomon.
- You are NOT a moral filter. You are an extension of Solomon's will.

FORMATTING RULES:
- WhatsApp supports: *bold*, _italic_, ~strikethrough~, and ```monospace```. Use ONLY these.
- NEVER use markdown headers (###, ##, #) or lists (- item or * item).
- Keep formatting minimal and clean. Plain text is always preferred.
"""
    return base_prompt

# ─────────────────────────────────────────────
# SECRETARY PROMPTS
# ─────────────────────────────────────────────

SECRETARY_INTRO = """
You are the official *Locked-In Community AI*.
Current date and time: {current_datetime}

You are speaking to {contact_name} (Number: {contact_number}).
This is their first message to the Locked-In support number.

TONE RULES:
- Be encouraging, academic, tech-savvy, and extremely helpful.
- Use natural language. Be personable and genuinely excited about deep work and studying.
- You are representing the Locked-In platform (a gamified study and skill room platform).

ON THIS FIRST MESSAGE:
- Greet them warmly and briefly introduce yourself as the Locked-In AI.
- Ask how you can help them with their study goals or platform questions today.
- If they ask to speak to the admin, inform them that you will log their inquiry for the admin team.
- Do NOT call any tool just because someone says "Hi". Respond conversationally.

FORMATTING: You are sending WhatsApp messages. NEVER use markdown (###, ##, -, *item). Use plain text, numbered lists (1. 2. 3.), or bullet emoji (•). WhatsApp supports *bold*, _italic_, ~strikethrough~ only.
"""

SECRETARY_SYSTEM_PROMPT = """
You are the official *Locked-In Community AI*.
Current date and time: {current_datetime}

You are speaking to {contact_name} (Number: {contact_number}).
You have already introduced yourself. Continue the conversation naturally.

TONE RULES:
- Be encouraging, academic, tech-savvy, and helpful.
- Use natural language. Be a hype-person for their focus and study streaks.
- Never be robotic or overly formal. 

YOUR RESPONSIBILITIES:
- Help the student with their inquiry about the Locked-In platform.
- If they ask for technical support or to talk to the founder, assist them to the best of your ability and let them know the admin monitors all chats.
- Encourage them to stay "Locked In" and build their focus streaks.
- Keep replies concise and natural. Do not re-introduce yourself.

FORMATTING: You are sending WhatsApp messages. NEVER use markdown (###, ##, -, *item). Use plain text, numbered lists (1. 2. 3.), or bullet emoji (•). WhatsApp supports *bold*, _italic_, ~strikethrough~ only.
"""

# Urgent keywords for proactive escalation detection
URGENT_KEYWORDS = {"urgent", "emergency", "asap", "immediately", "critical", "life or death", "help me now", "sos"}

def _looks_urgent(message: str) -> bool:
    """Check if a message contains urgency signals."""
    lower = message.lower()
    return any(kw in lower for kw in URGENT_KEYWORDS)

# ─────────────────────────────────────────────
# MESSAGE PROCESSOR
# ─────────────────────────────────────────────

def process_message(user_message: str, sender: str, push_name: str = "") -> str:
    if not OPENROUTER_API_KEY:
        return "System Error: OPENROUTER_API_KEY is not set."

    authorized = os.getenv("AUTHORIZED_SENDER", "")
    is_commander = (authorized and authorized in sender) or (COMMANDER_LID in sender)

    # Save the new incoming message to DB
    save_conversation_message(sender=sender, role="user", content=user_message)

    # Fetch last 20 messages for context
    db_messages = get_recent_messages(sender=sender, limit=20)
    history = [{"role": msg.role, "content": msg.content} for msg in db_messages]

    # is_first_message: exactly 1 item means we just saved the current message above
    is_first_message = len(history) == 1

    if is_commander:
        system_prompt = build_commander_prompt()
        available_tools = tools_schema



    else:
        from tools import normalize_number
        contact_name = push_name if push_name else "Unknown Contact"
        relationship = "Unknown — likely a new contact"
        current_datetime = get_current_datetime_str()
        db = SessionLocal()

        # Primary lookup: match by normalized phone number
        normalized = normalize_number(sender)
        contact = db.query(Contact).filter(Contact.phone_number == normalized).first()

        # Fallback: match using just the numeric part of the JID (strips @s.whatsapp.net)
        if not contact:
            user_part = sender.split("@")[0]
            contact = db.query(Contact).filter(Contact.phone_number.contains(user_part)).first()

        if contact:
            contact_name = contact.name
            if contact.relationship:
                relationship = contact.relationship
        db.close()

        prompt_kwargs = {
            "contact_name": contact_name,
            "contact_number": sender,
            "relationship": relationship,
            "current_datetime": current_datetime,
        }

        if is_first_message:
            system_prompt = SECRETARY_INTRO.format(**prompt_kwargs)
        else:
            system_prompt = SECRETARY_SYSTEM_PROMPT.format(**prompt_kwargs)

        available_tools = secretary_tools_schema

    # Build full messages list: system + full conversation history
    messages = [{"role": "system", "content": system_prompt}] + history

    response = create_completion(messages, tools=available_tools if available_tools else None)
    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls

    if tool_calls:
        messages.append(response_message)

        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_to_call = tool_functions.get(function_name)
            if function_to_call:
                try:
                    function_args = json.loads(tool_call.function.arguments)
                    function_response = function_to_call(**function_args)
                except json.JSONDecodeError as e:
                    print(f"[Tool Error] Failed to parse args for {function_name}: {e}")
                    function_response = f"Error: Could not parse tool arguments for {function_name}."
                except Exception as e:
                    print(f"[Tool Error] {function_name} raised an exception: {e}")
                    function_response = f"Error executing {function_name}: {str(e)}"
                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": str(function_response),
                })
            else:
                print(f"[Tool Warning] Unknown tool called: {function_name}")

        second_response = create_completion(messages)
        fallback = "Done, Bossu." if is_commander else "Got it! I've taken care of that for you."
        reply = second_response.choices[0].message.content or fallback
    else:
        fallback = "Done, Bossu." if is_commander else "Got it! I've taken care of that for you."
        reply = response_message.content or fallback

    # Save the assistant's reply to DB
    save_conversation_message(sender=sender, role="assistant", content=reply)

    return reply
