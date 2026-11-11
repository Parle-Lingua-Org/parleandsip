import { Suspense } from "react";
import { PaymentReturn } from "@/components/site/payment-return";

export default function Page() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-background px-4 text-foreground"><p className="font-mono text-xs text-muted-foreground">Checking your payment.</p></main>}>
      <PaymentReturn />
    </Suspense>
  );
}
