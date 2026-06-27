# SyncInk Platform Architecture

## Introduction
The SyncInk Support platform breaks away from traditional monolith Discord bot designs. By separating UI layers from business logic, the platform is ready for multi-client access (Discord Bot, Web Dashboard, REST API).

## Directory Layout
- **`cogs/`**: The Discord UI layer. Handles slash commands, event listeners, and interaction with Discord Modals/Buttons.
- **`services/`**: The Business Logic layer. `SettingsService` and `ModService` communicate directly with the DB. These functions have zero reliance on `discord.py` objects, meaning a web dashboard can import and use them directly.
- **`utils/`**: Core infrastructure.
  - `ui.py`: Base Embeds ensuring brand consistency.
  - `tasks.py`: `TaskManager` for executing self-healing background jobs.
  - `i18n.py`: Localization engine pulling from `locales/`.
  - `validator.py`: Pre-flight checks before the bot boots up.
- **`migrations/`**: SQL files executed sequentially to update the database schema without data loss.

## Adding New Features
1. **Define the Schema:** Add a new `.sql` file in `migrations/` (e.g., `002_add_economy.sql`).
2. **Build the Service:** Create a new file in `services/` containing the database interactions.
3. **Build the UI:** Create the Discord command in `cogs/` calling the new service, utilizing `utils.ui` for premium embeds.
