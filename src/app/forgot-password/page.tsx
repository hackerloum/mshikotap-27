"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const result = await authService.forgotPassword(email.trim());
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setSent(true);
    toast.success("Password reset email sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center mesh-bg px-4 py-12">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)] text-2xl">
              Reset password
            </CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send a reset link. In demo mode
              the request always succeeds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-sm text-slate-300">
                <p>
                  If an account exists for{" "}
                  <span className="text-teal-300">{email}</span>, a reset link
                  is on the way.
                </p>
                <Link href="/login">
                  <Button className="w-full">Back to login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}
            <p className="mt-5 text-center text-sm text-slate-400">
              <Link href="/login" className="text-teal-300 hover:text-teal-200">
                Back to login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
