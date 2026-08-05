"use client";
import { useEffect, useState } from "react";
import betterStine from "/public/icons/betterstine.svg";
import logoWhite from "/public/stineultras-white.svg";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [adminUsername, setAdminUsername] = useState<string>("");

  useEffect(() => {
    // Fetch current admin session info
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.admin) {
          setAdminUsername(data.admin.username);
        }
      })
      .catch(() => {
        // Session expired or invalid, middleware will handle redirect
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };
  return (
    <>
      <aside
        className="fixed left-0 top-0 w-64 bg-ocean p-4 flex flex-col gap-4"
        style={{ height: "calc(100dvh)" }}>
        <div className="flex items-center gap-6 pb-4">
          <Link href="/">
            <Image src={betterStine} alt="STiNE Ultras Logo" width={64} />
          </Link>
          <Link href="/">
            <Image src={logoWhite} alt="STiNE Ultras" height={64} />
          </Link>
        </div>

        <h2 className="text-lg font-bold text-white pt-4">Navigation</h2>
        <nav className="flex flex-col gap-2">
          <Link
            href="admin/panel"
            className="text-white hover:text-white/80 transition">
            Panel
          </Link>
          <Link
            href="admin/modul/doppler"
            className="text-white hover:text-white/80 transition">
            Doppler
          </Link>
          <Link
            href="admin/modul/tinder"
            className="text-white hover:text-white/80 transition">
            Tinder
          </Link>
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          {adminUsername && (
            <span className="text-sm opacity-80 text-white">
              Angemeldet als: <strong>{adminUsername}</strong>
            </span>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white hover:text-white/80 cursor-pointer">
            Abmelden
          </Button>
        </div>
      </aside>
      {children}
    </>
  );
}
