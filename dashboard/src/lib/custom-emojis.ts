export const DISCORD_CUSTOM_EMOJIS = {
  developer: {
    id: "1526607083070554192",
    name: "sync_developer",
    url: "https://cdn.discordapp.com/emojis/1526607083070554192.png",
  },
  staff: {
    id: "1513345698689581087",
    name: "claimers",
    url: "https://cdn.discordapp.com/emojis/1513345698689581087.png",
  },
  verified: {
    id: "1560001214316544092",
    name: "verified",
    url: "https://cdn.discordapp.com/emojis/1560001214316544092.png",
  },
  booster: {
    id: "1560008772469002291",
    name: "booster",
    url: "https://cdn.discordapp.com/emojis/1560008772469002291.png",
  },
  admin: {
    id: "1513805305492799508",
    name: "sync_admin",
    url: "https://cdn.discordapp.com/emojis/1513805305492799508.png",
  },
  owner: {
    id: "1517253606686986323",
    name: "sync_owner",
    url: "https://cdn.discordapp.com/emojis/1517253606686986323.png",
  },
} as const;

export function getRoleCustomEmojiUrl(roleType?: string): string {
  switch (roleType) {
    case "owner":
      return DISCORD_CUSTOM_EMOJIS.owner.url;
    case "admin":
      return DISCORD_CUSTOM_EMOJIS.admin.url;
    case "staff":
      return DISCORD_CUSTOM_EMOJIS.staff.url;
    case "developer":
      return DISCORD_CUSTOM_EMOJIS.developer.url;
    case "booster":
      return DISCORD_CUSTOM_EMOJIS.booster.url;
    case "verified":
      return DISCORD_CUSTOM_EMOJIS.verified.url;
    default:
      return "";
  }
}
