import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";
import "../auth.css";

export const metadata: Metadata = {
  title: "Create account — CardO",
  description: "Create a CardO account for billing cycles and spend limits.",
};

export default function SignUpPage() {
  return <AuthScreen initialMode="signup" />;
}
