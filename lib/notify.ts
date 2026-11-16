"use client";

import { toast } from "sonner";
import { toUserMessage } from "@/lib/errors";

export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyInfo(message: string) {
  toast.message(message);
}

export function notifyError(reason: unknown, fallback?: string) {
  toast.error(toUserMessage(reason, fallback));
}
