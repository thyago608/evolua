import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Users, ClipboardList, LogOut, Activity } from "lucide-react";
import { db } from "@/db";
import { responses, patients } from "@/db/schema";
import { logoutAction } from "../actions";
import { Button } from "@/components/ui/button";
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

  const navItems = [
    { href: "/admin", label: "Painel", icon: Activity },
    { href: "/admin/patients/new", label: "Novo paciente", icon: Users },
    { href: "/admin/forms", label: "Formulários", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">
              Evolua.
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
              <NotificationsPopover items={items} totalUnseen={totalUnseen} />
            </nav>
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" className="gap-2" type="submit">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
