import os
from utils.logger import log
from utils.exceptions import ConfigurationError
import sys

def validate_environment():
    """Validates that all required environment variables and conditions are met before startup."""
    log.info("Starting environment validation...")
    
    required_vars = ["DISCORD_TOKEN", "DATABASE_URL"]
    missing = [var for var in required_vars if not os.getenv(var) or os.getenv(var) == "your_discord_bot_token_here"]
    
    if missing:
        log.critical(f"Missing or invalid required environment variables: {', '.join(missing)}")
        log.critical("Please update your .env file or Railway variables and restart.")
        sys.exit(1)
        
    # We could also validate API reachability here via a simple HTTP GET if needed
    log.info("Environment validation passed.")
