import { redirect } from "next/navigation";

// Email verification is handled during registration flow
export default function VerifyPage() {
  redirect("https://accounts.realvs.ai/sign-in");
}
