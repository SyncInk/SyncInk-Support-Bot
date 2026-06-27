# SyncInk Support Platform

Welcome to the SyncInk Support Platform repository. This project is a highly scalable, robust Discord platform engineered with enterprise-grade features, designed specifically for deployment on Railway.

## Architecture Highlights
- **Service-Oriented Architecture:** Core business logic is decoupled from Discord UI via the `services/` layer, ensuring future Dashboard integrations share the exact same logic.
- **PostgreSQL Migrations:** Automatic, versioned SQL schema migrations.
- **Background Task Manager:** Self-recovering, isolated background tasks monitored via `/debug`.
- **Localization (i18n):** User-facing text is extracted into JSON locale files.
- **Premium UI:** A unified UI framework enforces SyncInk brand consistency across all commands, modals, and views.
- **Centralized Permissions:** Powerful database-backed permission decorators.

## Setup & Deployment

### 1. Prerequisites
- Python 3.10+
- PostgreSQL Server

### 2. Local Setup
1. Clone the repository.
2. Install dependencies: `pip install -r requirements.txt`
3. Create a `.env` file based on `.env.example`:
   - `DISCORD_TOKEN`
   - `DATABASE_URL` (e.g., `postgresql://user:pass@localhost:5432/syncink_db`)
4. Start the bot: `python main.py`

*Note: Migrations will automatically apply on startup.*

### 3. Railway Production Deployment
This repository is pre-configured for Railway.
1. Connect this repo to a Railway project.
2. Provision a PostgreSQL Database inside Railway.
3. Railway will automatically populate `DATABASE_URL`. Ensure you manually add `DISCORD_TOKEN`.
4. Railway will build using `requirements.txt` and start the worker via the `Procfile`.

## Diagnostics
Developers can use the following commands to monitor the platform:
- `/health`: Checks DB ping and WebSocket latency.
- `/system`: Checks CPU usage, Memory, and Thread count.
- `/debug`: Views the status of all managed background tasks.

For detailed internal architecture, please refer to the `docs/` folder.
