import Link from "next/link";

type SignInPageProps = {
  searchParams: Promise<{
    invite?: string;
    email?: string;
  }>;
};

function providerHref(provider: "google" | "microsoft", invite?: string) {
  const params = new URLSearchParams({
    returnTo: "/"
  });

  if (invite) {
    params.set("invite", invite);
  }

  return `/api/auth/${provider}/start?${params.toString()}`;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const googleConfigured = Boolean(process.env.GOOGLE_AUTH_CLIENT_ID);
  const microsoftConfigured = Boolean(process.env.MICROSOFT_AUTH_CLIENT_ID);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
      <section className="w-full rounded-lg border border-[color:var(--accent)]/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">Trainer access</p>
        <h1 className="mt-3 text-4xl font-black text-[color:var(--accent-strong)]">Sign in to your workspace</h1>
        <p className="mt-4 leading-7">
          Use the account tied to your invite. Trainer opens the right home for parents, athletes, coaches, and
          administrators after sign-in.
        </p>
        {params.email ? (
          <p className="mt-4 rounded-md bg-[color:var(--panel)] p-3 text-sm font-bold">
            Invite email: {params.email}
          </p>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {googleConfigured ? (
            <Link
              className="rounded-md bg-[color:var(--accent-strong)] px-4 py-3 text-center font-bold text-white"
              href={providerHref("google", params.invite)}
            >
              Continue with Google
            </Link>
          ) : null}
          {microsoftConfigured ? (
            <Link
              className="rounded-md border border-[color:var(--accent-strong)]/25 px-4 py-3 text-center font-bold text-[color:var(--accent-strong)]"
              href={providerHref("microsoft", params.invite)}
            >
              Continue with Microsoft
            </Link>
          ) : null}
        </div>
        {!googleConfigured && !microsoftConfigured ? (
          <p className="mt-6 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm font-bold text-yellow-900">
            Sign-in providers are not configured for this environment yet.
          </p>
        ) : null}
      </section>
    </main>
  );
}
