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
import { Plus, Trash2, Pencil, CalendarArrowDown, Upload } from "lucide-react";
import { Stundenplan } from "@/hooks/use-stundenplan";
import { Separator } from "./ui/separator";

type StundenplanControlsProps = {
  stundenplaene: Stundenplan[];
  currentStundenplanId: string | null;
  currentSemesterId: number | null;
  semesters: Array<{ id: number; name: string }>;
  onLoadStundenplan: (id: string) => void;
  onCreateStundenplan: (name: string, semesterId: number) => void;
  onDeleteStundenplan: (id: string) => void;
  onRenameStundenplan: (id: string, newName: string) => void;
  onShareStundenplan: () => void;
  onExportStundenplan: () => void;
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
  onShareStundenplan,
  onExportStundenplan,
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
      <div className="flex items-center gap-0 rounded-md border border-neutral-200 bg-white shadow-sm">
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" 
              className="rounded-r-[0px] border-0 shadow-none"
              onClick={() => {
                if (!currentPlan) return;
                setRenamePlanId(currentPlan.id);
                setRenamePlanName(currentPlan.name);
                setShowRenameDialog(true);
              }}
              title="Stundenplan bearbeiten">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stundenplan bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Neuer Name</label>
              <Input
                placeholder="Neuer Name"
                value={renamePlanName}
                onChange={(e) => setRenamePlanName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
            </div>
            <DialogFooter className="sm:justify-between">
              {/* Löschen */}
              <Button
                variant="destructive"
                onClick={() => {
                  if (!currentPlan) return;
                  handleDelete(currentPlan.id);
                }}
                title="Aktuellen Stundenplan löschen">
                <Trash2 className="h-4 w-4" />
                Löschen
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRenameDialog(false)}
                  title="Dialog schließen ohne umzubenennen">
                  Abbrechen
                </Button>
                <Button
                  onClick={handleRename}
                  disabled={!renamePlanName.trim()}
                  title="Stundenplan mit neuem Namen speichern">
                  Speichern
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Separator orientation="vertical" className="h-6 -mr-px" />

        {/* Stundenplan Auswahl */}
        <Select
          value={currentStundenplanId || ""}
          onValueChange={onLoadStundenplan}>
          <SelectTrigger className="w-[200px] rounded-[0px] h-9 border-0 shadow-none" title="Stundenplan auswählen">
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
        <Separator orientation="vertical" className="h-6" />

        {/* Neuer Stundenplan */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="rounded-l-[0px] border-0 shadow-none"
              title="Neuen Stundenplan erstellen">
              <Plus className="h-4 w-4" />
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
                  <SelectTrigger title="Wähle das Semester für den neuen Stundenplan">
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
                onClick={() => setShowCreateDialog(false)}
                title="Dialog schließen ohne zu erstellen">
                Abbrechen
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !newPlanName.trim() || !(newPlanSemesterId || currentSemesterId)
                }
                title="Neuen Stundenplan erstellen">
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
            <AlertDialogCancel title="Löschen abbrechen">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              title="Stundenplan endgültig löschen">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export */}
      <div className="flex items-center gap-0 rounded-md border border-neutral-200 bg-white shadow-sm">
        {/* Teilen Button */}
        <Button
          variant="outline"
          className="border-0 rounded-r-[0px] shadow-none"
          onClick={() => onShareStundenplan()}
          title="Stundenplan-Link teilen">
          <Upload className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />

        {/* Exportieren Button */}
        <Button
          variant="outline"
          className="border-0 rounded-l-[0px] shadow-none"
          onClick={() => onExportStundenplan()}
          title="Stundenplan exportieren">
          <CalendarArrowDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
