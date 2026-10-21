export const DISCORD_CUSTOM_EMOJIS = {
  developer: {
    id: "1562591562754424872",
    name: "developer",
    url: "https://cdn.discordapp.com/emojis/1562591562754424872.png",
    discordFormat: "<:developer:1562591562754424872>",
    animated: false,
  },
  staff: {
    id: "1562591917295009802",
    name: "staff",
    url: "https://cdn.discordapp.com/emojis/1562591917295009802.png",
    discordFormat: "<:staff:1562591917295009802>",
    animated: false,
  },
  region: {
    id: "1562591209543966831",
    name: "region",
    url: "https://cdn.discordapp.com/emojis/1562591209543966831.gif",
    discordFormat: "<a:region:1562591209543966831>",
    animated: true,
  },
  experience: {
    id: "1562588852324143125",
    name: "experience",
    url: "https://cdn.discordapp.com/emojis/1562588852324143125.png",
    discordFormat: "<:experience:1562588852324143125>",
    animated: false,
  },
  scenario1: {
    id: "1520914584012328961",
    name: "syncwarning",
    url: "https://cdn.discordapp.com/emojis/1520914584012328961.gif",
    discordFormat: "<a:syncwarning:1520914584012328961>",
    animated: true,
  },
  scenario2: {
    id: "1562587869762158762",
    name: "argument",
    url: "https://cdn.discordapp.com/emojis/1562587869762158762.png",
    discordFormat: "<:argument:1562587869762158762>",
    animated: false,
  },
  scenario3: {
    id: "1562590696337047744",
    name: "admin",
    url: "https://cdn.discordapp.com/emojis/1562590696337047744.png",
    discordFormat: "<:admin:1562590696337047744>",
    animated: false,
  },
  verified: {
    id: "1560001214316544092",
    name: "verified",
    url: "https://cdn.discordapp.com/emojis/1560001214316544092.png",
    discordFormat: "<:verified:1560001214316544092>",
    animated: false,
  },
  booster: {
    id: "1560008772469002291",
    name: "booster",
    url: "https://cdn.discordapp.com/emojis/1560008772469002291.png",
    discordFormat: "<:booster:1560008772469002291>",
    animated: false,
  },
  admin: {
    id: "1513805305492799508",
    name: "sync_admin",
    url: "https://cdn.discordapp.com/emojis/1513805305492799508.png",
    discordFormat: "<:sync_admin:1513805305492799508>",
    animated: false,
  },
  owner: {
    id: "1517253606686986323",
    name: "sync_owner",
    url: "https://cdn.discordapp.com/emojis/1517253606686986323.png",
    discordFormat: "<:sync_owner:1517253606686986323>",
    animated: false,
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
