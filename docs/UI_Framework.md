# UI Framework Guidelines

To maintain the premium "SyncInk" brand experience across all touchpoints, developers must NEVER use raw `discord.Embed()` or standard string replies.

Always import and use the components from `utils/ui.py`.

## Available Embeds
- `SyncInkEmbed(title, description)`: The base embed. Automatically applies the Brand Accent color, footer, and timestamp.
- `SuccessEmbed(description)`: For successful operations (Green, checkmark).
- `ErrorEmbed(description)`: For failures (Red, cross).
- `InfoCard(title, description)`: For generic information blocks.
- `LoadingEmbed(description)`: Display this when awaiting a long Service/API call.
- `EmptyStateEmbed(title, description)`: Display this instead of "No data" when a list or query returns empty.

## Interactive Views
- `BaseConfirmView`: A standard Yes/No confirmation dialog. Await `view.value` to branch logic.
- `PaginationView(embeds)`: Pass a list of `SyncInkEmbed`s, and this view handles the Next/Previous button pagination automatically.

*Always assign a `custom_id` to buttons/selects if they need to be persistent across bot restarts!*
