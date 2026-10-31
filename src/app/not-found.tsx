import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl">🤷</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <Link href="/" className="btn-primary">Go home</Link>
    </main>
  );
}
