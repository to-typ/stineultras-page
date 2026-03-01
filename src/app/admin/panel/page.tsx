"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import betterStine from "/public/icons/betterstine.svg";
import logoWhite from "/public/stineultras-white.svg";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const router = useRouter();
  const [adminUsername, setAdminUsername] = useState<string>("");

  // New admin form state
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [createAdminLoading, setCreateAdminLoading] = useState(false);

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

  const reset = async () => {
    const response = await fetch("/api/admin/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: "",
      }),
    });
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
    alert(JSON.stringify(result, null, 2));
  };

  const crawl = async () => {
    const response = await fetch("/api/admin/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        semester: "SoSe 26",
      }),
    });
    const result = await response.json();
    alert(JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    const jobIdInput = document.getElementById("jobId") as HTMLInputElement;
    jobIdInput.value = result.jobId;
  };

  const crawlModuls = async () => {
    const response = await fetch("/api/admin/crawl-moduls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        semester: "SoSe 26",
      }),
    });
    const result = await response.json();
    alert(JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    const jobIdInput = document.getElementById("jobId") as HTMLInputElement;
    jobIdInput.value = result.jobId;
  };

  const status = async () => {
    const jobIdInput = document.getElementById("jobId") as HTMLInputElement;
    const jobId = jobIdInput.value;
    const response = await fetch(`/api/admin/crawl?jobId=${jobId}`, {
      method: "GET",
    });
    const result = await response.json();
    alert(JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  };

  const createAdmin = async () => {
    if (!newAdminUsername || !newAdminPassword) {
      alert("Username und Passwort sind erforderlich!");
      return;
    }

    setCreateAdminLoading(true);
    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: newAdminUsername,
          password: newAdminPassword,
          name: newAdminName || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Admin "${result.admin.username}" erfolgreich erstellt!`);
        // Clear form
        setNewAdminUsername("");
        setNewAdminPassword("");
        setNewAdminName("");
      } else {
        alert(`Fehler: ${result.error}`);
      }
    } catch {
      alert("Fehler beim Erstellen des Admin-Accounts");
    } finally {
      setCreateAdminLoading(false);
    }
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
      <div className="text-white flex flex-col m-8 gap-6">
        {/* Admin Management Section */}
        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
          <h2 className="text-xl font-bold mb-4">Neuen Admin erstellen</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Username *"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
              className="p-3 rounded-lg text-black"
              disabled={createAdminLoading}
            />
            <input
              type="password"
              placeholder="Passwort (min. 8 Zeichen) *"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              className="p-3 rounded-lg text-black"
              disabled={createAdminLoading}
              autoComplete="new-password"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              className="p-3 rounded-lg text-black"
              disabled={createAdminLoading}
            />
            <button
              onClick={createAdmin}
              disabled={createAdminLoading}
              className="bg-green-600 p-3 rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {createAdminLoading ? "Wird erstellt..." : "Admin erstellen"}
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/20 my-2"></div>

        {/* Database Management Section */}
        <h2 className="text-xl font-bold">Datenbank-Verwaltung</h2>
        <input
          type="button"
          value="Datenbank zurücksetzen"
          onClick={reset}
          className="bg-red-600 p-4 rounded-lg hover:bg-red-700 cursor-pointer"
        />
        <input
          type="button"
          value="Daten von STiNE crawlen"
          onClick={crawl}
          className="bg-blue-600 p-4 rounded-lg hover:bg-blue-700 cursor-pointer"
        />
        <input
          type="button"
          value="Module crawlen"
          onClick={crawlModuls}
          className="bg-blue-800 p-4 rounded-lg hover:bg-blue-900 cursor-pointer"
        />
        <input
          type="text"
          placeholder="Job ID"
          id="jobId"
          className="p-4 rounded-lg text-black"
        />
        <input
          type="button"
          value="Crawl-Status prüfen"
          onClick={status}
          className="bg-yellow-600 p-4 rounded-lg hover:bg-yellow-700 cursor-pointer"
        />
      </div>
    </>
  );
}
