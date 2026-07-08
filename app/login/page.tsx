import { redirect } from "next/navigation"

// Redirect old /login route to new /sign-in route
export default function LoginPage() {
  redirect("/sign-in")
}
