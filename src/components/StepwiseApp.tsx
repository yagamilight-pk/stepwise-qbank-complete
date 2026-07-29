"use client";

import { usePathname } from "next/navigation";
import { MarketingPage } from "./Marketing";
import { AuthPage, OnboardingPage } from "./Auth";
import { AdminShell, InfluencerShell, LearnerShell } from "./Shells";
import { ForgotPasswordPage, HelpPage, NotFoundPage } from "./Support";
import { DemoPage } from "./Demo";

export default function StepwiseApp() {
  const pathname = usePathname();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  if (pathname === "/") {
    if (hostname.startsWith("app.")) return <LearnerShell/>;
    if (hostname.startsWith("admin.")) return <AdminShell/>;
    if (hostname.startsWith("influencer.")) return <InfluencerShell/>;
    return <MarketingPage/>;
  }
  if (pathname === "/try") return <DemoPage/>;
  if (pathname === "/login") return <AuthPage mode="login"/>;
  if (pathname === "/signup") return <AuthPage mode="signup"/>;
  if (pathname === "/onboarding") return <OnboardingPage/>;
  if (pathname === "/forgot-password") return <ForgotPasswordPage/>;
  if (pathname === "/help") return <HelpPage/>;
  if (pathname.startsWith("/admin")) return <AdminShell/>;
  if (pathname.startsWith("/influencer")) return <InfluencerShell/>;
  if (pathname.startsWith("/app")) return <LearnerShell/>;
  return <NotFoundPage/>;
}
