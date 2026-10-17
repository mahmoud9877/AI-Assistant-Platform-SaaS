"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { BookOpen, Building2, CircleUser, MessageSquare, Settings2, UserPlus, Users, type LucideIcon } from "lucide-react";
import { useAuthStore, LogoutButton } from "@/features/auth";
import { useMyEmployees } from "@/features/employees";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { LanguageToggle } from "@/components/layout/language-toggle";

interface ActionCardProps {
  icon: LucideIcon;
  color: "blue" | "purple" | "indigo";
  title: string;
  description: string;
  href: string;
  action: string;
  disabled?: boolean;
}

const COLORS = {
  blue: { icon: "bg-blue-500", button: "bg-blue-600 hover:bg-blue-700 text-white" },
  purple: { icon: "bg-purple-500", button: "bg-purple-600 hover:bg-purple-700 text-white" },
  indigo: { icon: "bg-indigo-500", button: "bg-indigo-600 hover:bg-indigo-700 text-white" },
};

function ActionCard({ icon: Icon, color, title, description, href, action, disabled }: ActionCardProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-none hover:bg-white/20 transition-all duration-300">
      <CardContent className="p-6 flex flex-col items-center text-center h-full">
        <div className={`w-16 h-16 rounded-full ${COLORS[color].icon} flex items-center justify-center mb-4`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-blue-200 mb-4 flex-1">{description}</p>
        {disabled ? (
          <Button className={`w-full ${COLORS[color].button}`} disabled>
            {action}
          </Button>
        ) : (
          <Button asChild className={`w-full ${COLORS[color].button}`}>
            <Link href={href}>{action}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const { data: myEmployees } = useMyEmployees();
  const hasEve = (myEmployees?.length ?? 0) > 0;

  return (
    <div className="min-h-screen relative overflow-hidden bg-eve">
      <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col">
        <header className="mb-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t("home.welcome")}
              {user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="text-blue-200">{t("home.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10">
                <Link href="/departments">
                  <Building2 className="h-4 w-4 me-2" />
                  {t("manageDepartments.link")}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10">
              <Link href="/account">
                <CircleUser className="h-4 w-4 me-2" />
                {t("account.title")}
              </Link>
            </Button>
            <LanguageToggle />
            <LogoutButton />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
            <ActionCard
              icon={UserPlus}
              color="blue"
              title={t("home.createEve")}
              description={t("home.createEveDesc")}
              href="/create-eve"
              action={t("home.getStarted")}
            />
            <ActionCard
              icon={MessageSquare}
              color="purple"
              title={t("home.talkToEve")}
              description={t("home.talkToEveDesc")}
              href="/chat-with-eve"
              action={hasEve ? t("home.startChat") : t("home.createEveFirst")}
              disabled={!hasEve}
            />
            <ActionCard
              icon={BookOpen}
              color="blue"
              title={t("home.teachEve")}
              description={t("home.teachEveDesc")}
              href="/knowledge"
              action={hasEve ? t("home.manageFiles") : t("home.createEveFirst")}
              disabled={!hasEve}
            />
            <ActionCard
              icon={Settings2}
              color="purple"
              title={t("home.manageEves")}
              description={t("home.manageEvesDesc")}
              href="/manage-eve"
              action={hasEve ? t("home.manage") : t("home.createEveFirst")}
              disabled={!hasEve}
            />
            <ActionCard
              icon={Users}
              color="indigo"
              title={t("home.talkToOthers")}
              description={t("home.talkToOthersDesc")}
              href="/virtual-office"
              action={t("home.enterOffice")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
