"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    if (resolverRef.current) resolverRef.current(false);
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close(false);
        }}
      >
        {options ? (
          <DialogContent className="max-w-md p-5 sm:p-6">
            <DialogTitle className="pr-10 text-xl font-bold">{options.title}</DialogTitle>
            <DialogDescription className="mt-2 text-xs leading-5 text-muted-foreground">
              {options.description}
            </DialogDescription>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => close(false)}>
                {options.cancelLabel || "Cancel"}
              </Button>
              <Button
                type="button"
                variant={options.tone === "danger" ? "secondary" : "default"}
                className={options.tone === "danger" ? "border-2 border-foreground bg-primary text-primary-foreground" : undefined}
                onClick={() => close(true)}
              >
                {options.confirmLabel || "Confirm"}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmProvider.");
  return context.confirm;
}
