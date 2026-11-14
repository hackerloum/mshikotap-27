"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { paymentsService } from "@/services/payments.service";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency } from "@/lib/utils";
import type { PaymentRecord } from "@/types";

function Return() {
  const params = useSearchParams();
  const id = params.get("p");
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refreshProfile);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [error, setError] = useState("");
  const tries = useRef(0);

  useEffect(() => {
    if (!id || !hydrated || !user) return;
    let stop = false;
    async function poll() {
      const res = await paymentsService.get(id as string);
      if (stop) return;
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setPayment(res.data);
      if (res.data.status === "completed") {
        void refresh();
        return;
      }
      if (res.data.status !== "pending" || tries.current >= 60) return;
      tries.current += 1;
      window.setTimeout(() => void poll(), 3000);
    }
    void poll();
    return () => {
      stop = true;
    };
  }, [id, hydrated, user, refresh]);

  const done = payment?.status === "completed";
  const failed = payment && ["failed", "expired", "voided", "mismatch"].includes(payment.status);
  const home = user?.role === "advertiser" ? "/advertiser/credits" : "/user/premium";

  return (
    <div className="grid min-h-dvh place-items-center bg-ink-950 px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-ink-600 bg-ink-900 p-8 text-center">
        <Brand className="mx-auto mb-6 justify-center" />
        {error ? (
          <>
            <XCircle className="mx-auto h-14 w-14 text-rose-400" />
            <h1 className="mt-4 font-display text-3xl text-white">We could not check it</h1>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
          </>
        ) : done ? (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-mint" />
            <h1 className="mt-4 font-display text-3xl text-white">Payment received</h1>
            <p className="mt-2 text-sm text-slate-400">
              {payment.kind === "premium"
                ? "Premium is active on your account."
                : `${formatCurrency(payment.amount)} was added to your credits.`}
            </p>
          </>
        ) : failed ? (
          <>
            <XCircle className="mx-auto h-14 w-14 text-rose-400" />
            <h1 className="mt-4 font-display text-3xl text-white">Payment did not go through</h1>
            <p className="mt-2 text-sm text-slate-400">
              {payment.status === "mismatch"
                ? "The amount paid did not match. Contact support with your payment time."
                : "No money was taken. You can try again."}
            </p>
          </>
        ) : (
          <>
            <Clock className="mx-auto h-14 w-14 animate-pulse text-coin" />
            <h1 className="mt-4 font-display text-3xl text-white">Confirming your payment</h1>
            <p className="mt-2 text-sm text-slate-400">
              Approve the prompt on your phone. This page updates by itself.
            </p>
          </>
        )}
        <Link href={home} className="mt-6 block">
          <Button size="lg" className="w-full">
            Continue
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense>
      <Return />
    </Suspense>
  );
}
