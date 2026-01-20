"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/custom/auth-form";
import { SubmitButton } from "@/components/custom/submit-button";
import Logo from "@/components/custom/logo";

import { register } from "../actions";

import type { RegisterActionState } from "../types";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: "idle",
    },
  );

  useEffect(() => {
    if (!state || !state.status) return;

    if (state.status === "user_exists") {
      toast.error("Account already exists");
    } else if (state.status === "failed") {
      toast.error("Failed to create account");
    } else if (state.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state.status === "success") {
      toast.success("Account created successfully");
      router.refresh();
    }
  }, [state?.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#0A0A0B] px-4">
      {/* Background Effect */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px] opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-2xl border border-border/30 bg-[#0C0C0D] p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <Logo href="/" size={40} />
            <div className="text-center">
              <h1 className="text-[24px] font-normal text-foreground">Create an account</h1>
              <p className="text-[14px] text-muted-foreground/70 mt-1">
                Get started building with Orq
              </p>
            </div>
          </div>

          {/* Form */}
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton className="w-full h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors mt-2">
              Create Account
            </SubmitButton>
          </AuthForm>

          {/* Footer */}
          <p className="text-center text-[13px] text-muted-foreground/60 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-500 hover:text-blue-400 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
