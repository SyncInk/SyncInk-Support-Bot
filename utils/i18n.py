import json
import os
from typing import Dict
from utils.logger import log

class I18nManager:
    def __init__(self):
        self.locales: Dict[str, Dict[str, str]] = {}
        self.default_locale = "en_US"

    def load_locales(self):
        """Loads all JSON files from the locales directory."""
        locales_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "locales")
        if not os.path.exists(locales_dir):
            os.makedirs(locales_dir)
            return

        for filename in os.listdir(locales_dir):
            if filename.endswith(".json"):
                locale_name = filename[:-5]
                try:
                    with open(os.path.join(locales_dir, filename), "r", encoding="utf-8") as f:
                        self.locales[locale_name] = json.load(f)
                    log.info(f"Loaded locale: {locale_name}")
                except Exception as e:
                    log.error(f"Failed to load locale {locale_name}: {e}")

    def get(self, key: str, locale: str = None, **kwargs) -> str:
        """Retrieves and formats a localized string."""
        if not locale:
            locale = self.default_locale

        strings = self.locales.get(locale, self.locales.get(self.default_locale, {}))
        text = strings.get(key, f"Missing_Translation[{key}]")

        try:
            return text.format(**kwargs)
        except KeyError as e:
            log.warning(f"Missing format key {e} in translation {key}")
            return text

i18n = I18nManager()
