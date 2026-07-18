import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { STATUSES, type Task, type TaskStatus } from "../../lib/tasks";
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from "../../lib/queries";

import { useCanManageTasks } from "../permission-gate";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";

type DialogState =
  | { mode: "create"; status: TaskStatus }
  | { mode: "edit"; task: Task }
  | null;

export function Board() {
  const canManage = useCanManageTasks();
  const { data: tasks, isLoading, error } = useTasks();
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { pending: [], started: [], completed: [] };
    (tasks ?? []).forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  const activeTask = useMemo(
    () => (activeId ? (tasks ?? []).find((t) => t.id === activeId) ?? null : null),
    [activeId, tasks],
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const current = (tasks ?? []).find((t) => t.id === active.id);
    if (!current) return;

    let newStatus: TaskStatus | null = null;
    const overId = String(over.id);
    if (overId.startsWith("col:")) {
      newStatus = overId.slice(4) as TaskStatus;
    } else {
      const overTask = (tasks ?? []).find((t) => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }
    if (!newStatus || newStatus === current.status) return;
    update.mutate({ id: current.id, data: { status: newStatus } });
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        <div className="font-semibold text-destructive">Could not load tasks</div>
        <div className="mt-1 text-muted-foreground">{(error as Error).message}</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Board</h1>
          <p className="text-sm text-muted-foreground">
            {canManage ? "Drag to change status. Click a task to edit." : "Read-only view. Ask an admin for edit access."}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialog({ mode: "create", status: "pending" })}>
            <Plus className="mr-1 h-4 w-4" /> New task
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
          {STATUSES.map((s) => (
            <div key={s.id} className="snap-start">
              {isLoading ? (
                <ColumnSkeleton />
              ) : (
                <Column
                  status={s.id}
                  label={s.label}
                  hint={s.hint}
                  tasks={grouped[s.id]}
                  canManage={canManage}
                  onAdd={(status) => setDialog({ mode: "create", status })}
                  onEdit={(task) => setDialog({ mode: "edit", task })}
                  onDelete={(task) => setConfirmDelete(task)}
                />
              )}
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <TaskCard task={activeTask} canManage={false} onEdit={() => {}} onDelete={() => {}} />
          )}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialog !== null}
        onOpenChange={(v) => !v && setDialog(null)}
        mode={dialog?.mode ?? "create"}
        initial={
          dialog?.mode === "edit"
            ? dialog.task
            : dialog?.mode === "create"
            ? { status: dialog.status }
            : undefined
        }
        submitting={create.isPending || update.isPending}
        onSubmit={async (data) => {
          if (!dialog) return;
          if (dialog.mode === "create") {
            await create.mutateAsync(data);
          } else {
            await update.mutateAsync({ id: dialog.task.id, data });
          }
          setDialog(null);
        }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{confirmDelete?.title}&rdquo; will be removed for everyone in the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) remove.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ColumnSkeleton() {
  return (
    <div className="flex h-[60vh] w-[85vw] shrink-0 flex-col gap-2 rounded-xl border border-border/60 bg-card/40 p-3 md:w-auto">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}