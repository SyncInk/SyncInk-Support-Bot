import { redirect } from "next/navigation";

export default function GuildTranscriptRedirect({
  params,
}: {
  params: { guildId: string; ticketId: string };
}) {
  const { guildId, ticketId } = params;
  redirect(`https://syncink-discord-ticket-bot.vercel.app/dashboard/${guildId}/transcripts/${ticketId}`);
}
