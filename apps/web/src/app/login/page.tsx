import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";
import "../auth.css";

export const metadata: Metadata = {
  title: "Sign in — CardO",
  description: "Sign in to CardO to track billing cycles and personal spend limits.",
};

export default function LoginPage() {
  return <AuthScreen initialMode="signin" />;
}
