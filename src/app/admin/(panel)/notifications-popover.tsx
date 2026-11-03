"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { formatDateTimeBR } from "@/lib/dates";
import {
  clearNotificationsAction,
  markNotificationSeenAction,
} from "../actions";

export interface NotificationItem {
  id: string;
  patientId: string;
  patientName: string;
  submittedAt: Date;
}

export function NotificationsPopover({
  items,
  totalUnseen,
}: {
  items: NotificationItem[];
  totalUnseen: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function openNotification(responseId: string, patientId: string) {
    setOpen(false);
    startTransition(async () => {
      await markNotificationSeenAction(responseId);
      router.push(`/admin/patients/${patientId}`);
      router.refresh();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative gap-2">
          <Bell className="h-4 w-4" />
          Notificações
          {totalUnseen > 0 && (
            <Badge variant="destructive" className="ml-1">
              {totalUnseen}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium">Respostas novas</span>
          {totalUnseen > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await clearNotificationsAction();
                })
              }
            >
              {pending ? "Limpando..." : "Limpar notificações"}
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação nova.
            </p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={pending}
                onClick={() => openNotification(item.id, item.patientId)}
                className="block w-full border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted/50 disabled:cursor-wait"
              >
                <p className="font-medium">{item.patientName}</p>
                <p className="text-xs text-muted-foreground">
                  respondeu a pesquisa · {formatDateTimeBR(item.submittedAt)}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
