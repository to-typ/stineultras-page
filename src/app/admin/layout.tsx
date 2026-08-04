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
        <header
            className={`bg-ocean text-white flex gap-6 items-center justify-between px-4 h-24 py-4`}>
            <div className="flex items-center gap-6">
            <Link href="/">
                <Image src={betterStine} alt="STiNE Ultras Logo" width={64} />
            </Link>
            <Link href="/">
                <Image src={logoWhite} alt="STiNE Ultras" height={64} />
            </Link>
            </div>
            <div className="flex items-center gap-4">
            {adminUsername && (
                <span className="text-sm opacity-80">
                Angemeldet als: <strong>{adminUsername}</strong>
                </span>
            )}
            <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/30">
                Abmelden
            </Button>
            </div>
        </header>
        {children}
    </>
  );
}
