import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const authed = await requireAuth()
  if (authed) {
    redirect("/")
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-deep px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_-10%,rgb(51_122_183/0.35),transparent_60%)]"
      />
      <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="inline-flex rounded-md bg-navy px-3 py-1.5 text-lg font-bold tracking-[0.22em] text-white uppercase">
            Score<span className="text-gold">USA</span>
          </span>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">
            Applications dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}