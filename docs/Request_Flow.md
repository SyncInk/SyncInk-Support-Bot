# SyncInk Platform Request Flow

Understanding the request lifecycle is crucial for expanding the platform without introducing technical debt.

## The Lifecycle of a Discord Interaction
1. **User Interaction:** A user runs a slash command or clicks a button (e.g., `/warn`).
2. **Pre-flight Checks (Middleware):**
   - The interaction hits `@has_permission`, which evaluates if the user meets the DB-backed requirement.
   - Global `before_invoke` (or metrics interceptors) records the start time.
3. **Execution in Cog:**
   - The command in `cogs/moderation.py` parses the input.
   - It **does not** execute SQL. Instead, it delegates business logic to the Service Layer: `await ModService.log_case(...)`.
4. **Service Layer & Cache:**
   - `ModService` might check `FeatureService` to ensure moderation is enabled globally or for that guild.
   - If a fetch is required, it checks `CacheService` first. On cache miss, it queries PostgreSQL (`database.py`) and updates the cache.
5. **Localization & UI:**
   - The cog grabs the localized success message: `i18n.get("mod_warn_success", user=member.mention)`.
   - It builds a standard response using `utils.ui`: `embed = SuccessEmbed(...)`.
6. **Response & Post-flight:**
   - The cog sends the response.
   - The metrics tracker (`utils/metrics.py`) records the total execution time, incrementing `commands_executed`.

## Why Decouple?
By strictly following this flow, a future Web Dashboard can invoke `await ModService.log_case(...)` via a FastAPI route, bypassing the Discord Cog and UI entirely, while still benefiting from caching, metrics, and database safety.
