"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SystemCard({ onChanged }: { onChanged: () => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const createAdmin = async () => {
    if (!username.trim() || !password) {
      setError("Username und Passwort sind erforderlich.");
      return;
    }
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Admin konnte nicht erstellt werden.");
        return;
      }

      toast.success(`Admin „${data.admin.username}“ erstellt.`);
      setUsername("");
      setPassword("");
      setName("");
    } catch {
      setError("Netzwerkfehler beim Erstellen des Admin-Accounts.");
    } finally {
      setSaving(false);
    }
  };

  const resetEverything = async () => {
    const response = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      toast.error(data.error ?? "Reset fehlgeschlagen.");
      return;
    }
    toast.success(data.message ?? "Datenbank zurückgesetzt.");
    await onChanged();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System</CardTitle>
        <CardDescription>Admin-Accounts und Wartung.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Neuen Admin erstellen</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password">Passwort</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-name">Name (optional)</Label>
              <Input
                id="admin-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={createAdmin} disabled={saving} className="self-start">
            {saving ? "Wird erstellt…" : "Admin erstellen"}
          </Button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Datenbank zurücksetzen</h3>
              <p className="text-sm text-muted-foreground">
                Löscht sämtliche Kursdaten aller Semester. In der Produktion serverseitig gesperrt.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="self-start">
                    Alle Kursdaten löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Wirklich alle Kursdaten löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Veranstaltungen, Übungsgruppen, Termine und Module aller Semester werden
                      gelöscht. Semester und ihre URLs bleiben erhalten.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={resetEverything}>Löschen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
