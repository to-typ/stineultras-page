import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Stundenplan } from "@/hooks/use-stundenplan";

type StundenplanControlsProps = {
  stundenplaene: Stundenplan[];
  currentStundenplanId: string | null;
  currentSemesterId: number | null;
  semesters: Array<{ id: number; name: string }>;
  onLoadStundenplan: (id: string) => void;
  onCreateStundenplan: (name: string, semesterId: number) => void;
  onDeleteStundenplan: (id: string) => void;
  onRenameStundenplan: (id: string, newName: string) => void;
};

export function StundenplanControls({
  stundenplaene,
  currentStundenplanId,
  currentSemesterId,
  semesters,
  onLoadStundenplan,
  onCreateStundenplan,
  onDeleteStundenplan,
  onRenameStundenplan,
}: StundenplanControlsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanSemesterId, setNewPlanSemesterId] = useState<number | null>(
    null,
  );
  const [renamePlanId, setRenamePlanId] = useState<string | null>(null);
  const [renamePlanName, setRenamePlanName] = useState("");

  const handleCreate = () => {
    const semesterId = newPlanSemesterId || currentSemesterId;
    if (newPlanName.trim() && semesterId) {
      onCreateStundenplan(newPlanName.trim(), semesterId);
      setNewPlanName("");
      setNewPlanSemesterId(null);
      setShowCreateDialog(false);
    }
  };

  const handleRename = () => {
    if (renamePlanName.trim() && renamePlanId) {
      onRenameStundenplan(renamePlanId, renamePlanName.trim());
      setRenamePlanId(null);
      setRenamePlanName("");
      setShowRenameDialog(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteStundenplan(deleteId);
      setDeleteId(null);
      setShowDeleteDialog(false);
    }
  };

  const currentPlan = stundenplaene.find(
    (sp) => sp.id === currentStundenplanId,
  );

  return (
    <div className="flex items-center gap-3">
      {/* Stundenplan Auswahl */}
      <Select
        value={currentStundenplanId || ""}
        onValueChange={onLoadStundenplan}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Stundenplan wählen" />
        </SelectTrigger>
        <SelectContent>
          {stundenplaene.map((sp) => (
            <SelectItem key={sp.id} value={sp.id}>
              {sp.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Neuer Stundenplan */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Neu
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Stundenplan</DialogTitle>
            <DialogDescription>
              Erstelle einen neuen Stundenplan für ein Semester.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="Name des Stundenplans"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Semester</label>
              <Select
                value={
                  newPlanSemesterId?.toString() ||
                  currentSemesterId?.toString() ||
                  ""
                }
                onValueChange={(value) =>
                  setNewPlanSemesterId(parseInt(value, 10))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Semester auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem
                      key={semester.id}
                      value={semester.id.toString()}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !newPlanName.trim() || !(newPlanSemesterId || currentSemesterId)
              }>
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Umbenennen */}
      {currentPlan && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRenamePlanId(currentPlan.id);
              setRenamePlanName(currentPlan.name);
              setShowRenameDialog(true);
            }}>
            Umbenennen
          </Button>

          <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stundenplan umbenennen</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Neuer Name"
                  value={renamePlanName}
                  onChange={(e) => setRenamePlanName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                  }}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowRenameDialog(false)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={handleRename}
                  disabled={!renamePlanName.trim()}>
                  Speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Löschen */}
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-red-100 hover:text-red-600 hover:border-red-300"
            onClick={() => handleDelete(currentPlan.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Löschen Bestätigung */}
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Stundenplan löschen</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchtest du diesen Stundenplan wirklich löschen? Diese Aktion
                  kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700">
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
