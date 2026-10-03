"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ServerRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams ? searchParams.toString() : "";
    const target = "/dashboard/tickets" + (params ? `?${params}` : "");
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-muted, #94a3b8)",
      fontSize: "14px",
      fontFamily: "sans-serif"
    }}>
      Redirecting to ticket dashboard...
    </div>
  );
}

export default function TicketsServersRedirect() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted, #94a3b8)",
        fontSize: "14px",
        fontFamily: "sans-serif"
      }}>
        Loading...
      </div>
    }>
      <ServerRedirectContent />
    </Suspense>
  );
}
