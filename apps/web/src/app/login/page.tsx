import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";
import "../auth.css";

export const metadata: Metadata = {
  title: "Sign in — CardCue",
  description: "Sign in to CardCue to track billing cycles and personal cycle limits.",
};

export default function LoginPage() {
  return <AuthScreen initialMode="signin" />;
}
