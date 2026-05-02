import { redirect } from "next/navigation";

// Password reset is handled through /forgot page flow
export default function ResetPage() {
  redirect("https://accounts.realvs.ai/sign-in");
}
