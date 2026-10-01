import { redirect } from "next/navigation";

export default function GuildTranscriptRedirect({
  params,
}: {
  params: { guildId: string; ticketId: string };
}) {
  const { ticketId } = params;
  redirect(`/dashboard/tickets?tab=transcripts&ticketId=${ticketId}`);
}
