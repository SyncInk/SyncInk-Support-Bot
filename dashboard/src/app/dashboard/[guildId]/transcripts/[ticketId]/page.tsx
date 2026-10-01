import { redirect } from "next/navigation";

export default function LegacyTranscriptRedirect({
  params,
}: {
  params: { guildId: string; ticketId: string };
}) {
  const ticketId = params.ticketId;
  redirect(`/dashboard/tickets/transcripts/${ticketId}`);
}
