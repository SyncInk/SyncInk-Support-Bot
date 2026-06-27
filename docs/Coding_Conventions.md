# SyncInk Coding Conventions

This project is built for CI/CD and long-term maintainability. All pull requests must adhere to the following standards:

1. **Type Hinting**: All functions, methods, and service layer boundaries MUST include Python type hints (`from typing import List, Dict, Optional, Any`).
2. **No Circular Dependencies**: `cogs` depend on `services`, `services` depend on `database` and `cache`. NEVER import a cog into a service.
3. **Structured Logging**: Do not use `print()`. Always import `log` from `utils.logger` and use `log.info()`, `log.warning()`, or `log.error()`.
4. **Exception Handling**: Catch specific exceptions. If an error is meant to be shown to a user, raise a `UserFacingError` from `utils.exceptions` with a localized string from `i18n`.
5. **No Magic Strings**: User-facing text belongs in `locales/en_US.json`. SQL queries belong in `services/` (or ORM methods if upgraded).
6. **Feature Flags**: Always check `FeatureService.is_enabled("flag_name")` before executing a major module feature to support graceful degradation.
