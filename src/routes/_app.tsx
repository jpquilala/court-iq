import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppRoute,
});

function AppRoute() {
  return (
    <AuthProvider>
      <AppShell />
      <Toaster richColors theme="dark" position="top-center" />
    </AuthProvider>
  );
}
