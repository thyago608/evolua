import Link from "next/link";
import { cookies } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { db } from "@/db";
import { responses, patients } from "@/db/schema";
import { logoutAction } from "../actions";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import {
  NotificationsPopover,
  type NotificationItem,
} from "./notifications-popover";

async function getNotifications(): Promise<{
  items: NotificationItem[];
  totalUnseen: number;
}> {
  try {
    const unseen = await db
      .select({
        id: responses.id,
        patientId: responses.patientId,
        patientName: patients.name,
        submittedAt: responses.submittedAt,
      })
      .from(responses)
      .innerJoin(patients, eq(patients.id, responses.patientId))
      .where(eq(responses.seen, false))
      .orderBy(desc(responses.submittedAt));

    return {
      items: unseen.slice(0, 10),
      totalUnseen: unseen.length,
    };
  } catch {
    return { items: [], totalUnseen: 0 };
  }
}

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { items, totalUnseen } = await getNotifications();
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Link href="/admin" className="font-semibold md:hidden">
              Evolua.
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <NotificationsPopover items={items} totalUnseen={totalUnseen} />
            <form action={logoutAction}>
              <Button variant="ghost" size="sm" className="gap-2" type="submit">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
