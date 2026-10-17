"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { LanguageToggle } from "@/components/layout/language-toggle";

/** The animated, centered card shared by login, signup and the password pages. */
export function AuthLayout({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-eve">
      <AnimatedBackground />

      <div className="absolute top-4 end-4 z-10">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md p-6 relative z-10">
        <Card className="w-full shadow-xl border border-white/10 bg-white/10 backdrop-blur-sm">
          <CardHeader className="space-y-3 flex flex-col items-center text-white">
            <Image
              src="/placeholder.svg"
              alt="EVE Logo"
              width={80}
              height={80}
              priority
              className="mb-2 rounded-full border border-white/20 shadow-md"
            />
            <CardTitle className="text-2xl font-semibold text-center">{title}</CardTitle>
            {description && <CardDescription className="text-center text-sm text-white/70">{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

export const authInputClass = "bg-white/10 border border-white/20 text-white placeholder:text-white/50";
export const authLinkClass = "text-indigo-200 hover:text-white underline-offset-4 hover:underline";
