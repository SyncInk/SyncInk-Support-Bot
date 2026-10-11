"""
SyncInk Platform - Discord DAVE E2EE Voice Protocol Shim
Provides transparent fallback compatibility for Discord Audio & Video End-to-End Encryption (DAVE)
when native C/Rust 'davey' extensions cannot be compiled (notably on Termux / Android aarch64).
"""
import sys
import types
from utils.logger import log

def ensure_davey_loaded() -> bool:
    """
    Ensures Discord.py voice engine has DAVE support enabled without crashing.
    If native davey is present, it uses native davey.
    If native davey is missing (e.g. Termux / Android), it dynamically provides
    a pure-Python compatibility module in sys.modules so VoiceClient can connect smoothly.
    """
    # 1. Check if real davey is already installed
    try:
        import davey
        import discord.voice_state
        import discord.voice_client
        discord.voice_state.has_dave = True
        discord.voice_client.has_dave = True
        return True
    except ImportError:
        pass

    # 2. If already shimmed in sys.modules, ensure flags are set
    if "davey" in sys.modules:
        try:
            import discord.voice_state
            import discord.voice_client
            discord.voice_state.has_dave = True
            discord.voice_client.has_dave = True
        except Exception:
            pass
        return True

    # 3. Construct drop-in pure-Python shim module
    shim = types.ModuleType("davey")
    shim.__version__ = "0.1.6-syncink-shim"
    shim.DAVE_PROTOCOL_VERSION = 0  # Signal protocol version 0 (standard voice encryption)
    shim.DEBUG_BUILD = False

    class ProposalsOperationType:
        append = 0
        revoke = 1

    class CommitWelcome:
        def __init__(self, commit=b"", welcome=b""):
            self.commit = commit
            self.welcome = welcome

    class DaveSession:
        def __init__(self, protocol_version=0, user_id=0, channel_id=0):
            self.protocol_version = protocol_version
            self.user_id = user_id
            self.channel_id = channel_id
            self.ready = False
            self.voice_privacy_code = None

        def reinit(self, protocol_version, user_id, channel_id):
            self.protocol_version = protocol_version
            self.user_id = user_id
            self.channel_id = channel_id

        def get_serialized_key_package(self):
            return b""

        def reset(self):
            pass

        def set_passthrough_mode(self, mode, timeout=0):
            pass

        def set_external_sender(self, sender):
            pass

        def process_proposals(self, optype, msg):
            return None

        def process_commit(self, msg):
            pass

        def process_welcome(self, msg):
            pass

        def encrypt_opus(self, data: bytes) -> bytes:
            return data

    shim.ProposalsOperationType = ProposalsOperationType
    shim.CommitWelcome = CommitWelcome
    shim.DaveSession = DaveSession

    # Inject into sys.modules so `import davey` works anywhere in discord.py
    sys.modules["davey"] = shim

    try:
        import discord.voice_state
        import discord.voice_client
        discord.voice_state.has_dave = True
        discord.voice_client.has_dave = True
    except Exception as e:
        log.debug(f"[Voice Engine] Shim patch note: {e}")

    log.info("[Voice Engine] Discord voice DAVE compatibility shim loaded (Protocol 0).")
    return True

# Auto-execute on import
ensure_davey_loaded()
