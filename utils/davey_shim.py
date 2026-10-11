"""
SyncInk Platform - Discord DAVE E2EE Voice Protocol Shim
Provides transparent fallback compatibility for Discord Audio & Video End-to-End Encryption (DAVE)
when native C/Rust 'davey' extensions cannot be compiled (notably on Termux / Android aarch64).
"""
import sys
import types
import builtins
from utils.logger import log

def _build_davey_shim() -> types.ModuleType:
    shim = types.ModuleType("davey")
    shim.__version__ = "0.1.6-syncink-shim"
    shim.DAVE_PROTOCOL_VERSION = 0  # Request standard voice protocol 0
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
    return shim

def ensure_davey_loaded() -> bool:
    """
    Ensures Discord.py voice engine has DAVE support enabled without crashing.
    Injects shim module into sys.modules, builtins, and discord internals.
    """
    # 1. Check if real davey is already installed and usable
    has_native = False
    try:
        import davey
        if hasattr(davey, "DaveSession") and hasattr(davey, "DAVE_PROTOCOL_VERSION"):
            has_native = True
    except Exception:
        has_native = False

    if not has_native:
        shim = _build_davey_shim()
        sys.modules["davey"] = shim
        builtins.davey = shim

    # 2. Patch discord internals
    try:
        import discord.voice_state
        import discord.voice_client
        import discord.gateway

        davey_mod = sys.modules.get("davey")
        if davey_mod:
            discord.voice_state.davey = davey_mod
            discord.voice_client.davey = davey_mod
            discord.gateway.davey = davey_mod

        discord.voice_state.has_dave = True
        discord.voice_client.has_dave = True

        if not has_native:
            # Force max_dave_protocol_version to return 0 so Discord gateway uses standard RTP voice
            discord.voice_state.VoiceConnectionState.max_dave_protocol_version = property(lambda self: 0)

        log.info(f"[Voice Engine] Voice DAVE initialized (native={has_native}, protocol_ver={0 if not has_native else 'native'}).")
        return True
    except Exception as e:
        log.warning(f"[Voice Engine] Discord voice patch notice: {e}")
        return False

# Automatically activate shim as soon as this module is loaded
ensure_davey_loaded()
