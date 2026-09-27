import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";
import "../auth.css";

export const metadata: Metadata = {
  title: "Create account — CardCue",
  description: "Create a CardCue account to track statement cutoffs and cycle spending.",
};

export default function SignUpPage() {
  return <AuthScreen initialMode="signup" />;
}
