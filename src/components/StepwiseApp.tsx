"use client";

import { usePathname } from "next/navigation";
import { MarketingPage } from "./Marketing";
import { AuthPage, OnboardingPage } from "./Auth";
import { AdminShell, LearnerShell } from "./Shells";
import { ForgotPasswordPage, HelpPage, LegalPage, NotFoundPage } from "./Support";
import { DemoPage } from "./Demo";

export default function StepwiseApp() {
  const pathname = usePathname();
  if (pathname === "/") return <MarketingPage/>;
  if (pathname === "/try") return <DemoPage/>;
  if (pathname === "/login") return <AuthPage mode="login"/>;
  if (pathname === "/signup") return <AuthPage mode="signup"/>;
  if (pathname === "/onboarding") return <OnboardingPage/>;
  if (pathname === "/forgot-password") return <ForgotPasswordPage/>;
  if (pathname === "/help") return <HelpPage/>;
  if (pathname === "/privacy") return <LegalPage type="privacy"/>;
  if (pathname === "/terms") return <LegalPage type="terms"/>;
  if (pathname === "/accessibility") return <LegalPage type="accessibility"/>;
  if (pathname.startsWith("/admin")) return <AdminShell/>;
  if (pathname.startsWith("/app")) return <LearnerShell/>;
  return <NotFoundPage/>;
}
