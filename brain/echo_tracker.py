"""
echo_tracker.py — Shared bot-echo detection module.

Extracted from main.py so that tools.py can register outgoing messages
(sent via send_whatsapp_message tool) without creating circular imports.
"""
import hashlib
import time

# {(chat_jid, content_md5): sent_at_unix_time}
bot_sent_queue: dict = {}
BOT_ECHO_EXPIRY_SECONDS = 15


def register_bot_sent(recipient_jid: str, text: str):
    """Register a message the bot just sent so we can identify its echo."""
    key = (recipient_jid, hashlib.md5(text.encode()).hexdigest())
    bot_sent_queue[key] = time.time()
    # Clean up stale entries
    cutoff = time.time() - BOT_ECHO_EXPIRY_SECONDS
    stale = [k for k, v in bot_sent_queue.items() if v < cutoff]
    for k in stale:
        del bot_sent_queue[k]


def is_bot_echo(chat_jid: str, text: str) -> bool:
    """Returns True if this outgoing message was sent by the bot, not Solomon manually."""
    key = (chat_jid, hashlib.md5(text.encode()).hexdigest())
    if key in bot_sent_queue:
        del bot_sent_queue[key]  # Consume — each echo is matched once
        return True
    return False
