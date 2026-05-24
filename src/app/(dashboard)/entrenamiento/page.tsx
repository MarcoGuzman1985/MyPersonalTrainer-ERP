"use client";

import { useMemo, useState, type DragEvent } from "react";
import {
  Dumbbell, GripVertical, PlayCircle, Plus, Trash2, Layers,
} from "lucide-react";
import {
  PageHeader, Button, Card, CardHeader, CardContent, Badge, Field, Input, Modal,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { CrossfitTimer } from "@/components/modules/training/CrossfitTimer";
import { exercisesMock, muscleGroupLabels, sampleRoutineMock } from "@/lib/api/training";
import type { Exercise, MuscleGroup, RoutineBlock, RoutineExercise } from "@/types/training";

let counter = 0;
/** Genera ids únicos en el cliente para nuevos RoutineExercise. */
const uid = (prefix: string) => `${prefix}_${Date.now()}_${++counter}`;

const groupKeys = Object.keys(muscleGroupLabels) as MuscleGroup[];

export default function EntrenamientoPage() {
  // TODO(backend): cargar exercisesMock/sampleRoutineMock vía getExercises()/getRoutine().
  const [filter, setFilter] = useState<MuscleGroup | "todos">("todos");
  const [blocks, setBlocks] = useState<RoutineBlock[]>(sampleRoutineMock);
  const [dragExercise, setDragExercise] = useState<Exercise | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [video, setVideo] = useState<{ name: string; url?: string } | null>(null);

  const filtered = useMemo(
    () => (filter === "todos" ? exercisesMock : exercisesMock.filter((e) => e.muscleGroup === filter)),
    [filter],
  );

  const totalExercises = useMemo(
    () => blocks.reduce((acc, b) => acc + b.exercises.length, 0),
    [blocks],
  );

  // --- Drag & drop nativo HTML5 ---
  const handleDragStart = (ex: Exercise) => (e: DragEvent<HTMLDivElement>) => {
    setDragExercise(ex);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", ex.id);
  };

  const handleDragOver = (blockId: string) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropTarget(blockId);
  };

  const handleDrop = (blockId: string) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropTarget(null);
    if (!dragExercise) return;
    const newItem: RoutineExercise = {
      id: uid("re"),
      exerciseId: dragExercise.id,
      name: dragExercise.name,
      sets: 3,
      reps: 10,
      rpe: 7,
      restSec: 60,
      videoUrl: dragExercise.videoUrl,
    };
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, exercises: [...b.exercises, newItem] } : b)),
    );
    setDragExercise(null);
  };

  // --- Mutaciones de la rutina ---
  const updateField = (blockId: string, itemId: string, key: keyof RoutineExercise, value: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id !== blockId
          ? b
          : {
              ...b,
              exercises: b.exercises.map((it) =>
                it.id === itemId ? { ...it, [key]: Math.max(0, value) } : it,
              ),
            },
      ),
    );
  };

  const removeItem = (blockId: string, itemId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, exercises: b.exercises.filter((it) => it.id !== itemId) } : b,
      ),
    );
  };

  const addBlock = () => {
    setBlocks((prev) => [...prev, { id: uid("blk"), title: `Bloque ${prev.length + 1}`, exercises: [] }]);
  };

  const renameBlock = (blockId: string, title: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, title } : b)));
  };

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  return (
    <>
      <PageHeader
        title="Entrenamiento"
        description="Diseña rutinas arrastrando ejercicios y controla tus WODs con el cronómetro."
        actions={
          <Button icon={Plus} onClick={addBlock} variant="outline">
            Añadir bloque
          </Button>
        }
      />

      <Tabs defaultValue="diseno">
        <TabsList>
          <TabsTrigger value="diseno">Diseñador de rutinas</TabsTrigger>
          <TabsTrigger value="timer">Cronómetro</TabsTrigger>
        </TabsList>

        <TabsContent value="diseno">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            {/* Panel izquierdo: biblioteca */}
            <Card className="lg:sticky lg:top-4 lg:self-start">
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-brand-800" />
                    Biblioteca
                  </span>
                }
                description="Arrastra un ejercicio hacia un bloque."
              />
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilter("todos")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      filter === "todos"
                        ? "bg-brand-800 text-white"
                        : "bg-surface-muted text-content-muted hover:text-content",
                    )}
                  >
                    Todos
                  </button>
                  {groupKeys.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFilter(g)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        filter === g
                          ? "bg-brand-800 text-white"
                          : "bg-surface-muted text-content-muted hover:text-content",
                      )}
                    >
                      {muscleGroupLabels[g]}
                    </button>
                  ))}
                </div>

                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {filtered.map((ex) => (
                    <div
                      key={ex.id}
                      draggable
                      onDragStart={handleDragStart(ex)}
                      onDragEnd={() => setDragExercise(null)}
                      className="flex cursor-grab items-center gap-2 rounded-lg border border-line bg-surface p-3 active:cursor-grabbing hover:border-brand-500 hover:bg-surface-muted"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-content-subtle" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-content">{ex.name}</p>
                        <p className="text-xs text-content-subtle">{ex.equipment}</p>
                      </div>
                      <Badge tone="neutral">{muscleGroupLabels[ex.muscleGroup]}</Badge>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="py-6 text-center text-sm text-content-subtle">
                      Sin ejercicios para este filtro.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Panel derecho: constructor */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-content-muted">
                <Layers className="h-4 w-4" />
                {blocks.length} bloques · {totalExercises} ejercicios
              </div>

              {blocks.map((block) => (
                <Card
                  key={block.id}
                  className={cn(
                    "transition-colors",
                    dropTarget === block.id && "ring-2 ring-brand-500",
                  )}
                  onDragOver={handleDragOver(block.id)}
                  onDragLeave={() => setDropTarget((t) => (t === block.id ? null : t))}
                  onDrop={handleDrop(block.id)}
                >
                  <CardHeader
                    title={
                      <input
                        value={block.title}
                        onChange={(e) => renameBlock(block.id, e.target.value)}
                        className="w-full rounded-md bg-transparent text-base font-semibold text-content focus:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        aria-label="Título del bloque"
                      />
                    }
                    action={
                      <Button
                        size="icon"
                        variant="ghost"
                        icon={Trash2}
                        aria-label="Eliminar bloque"
                        onClick={() => removeBlock(block.id)}
                      />
                    }
                  />
                  <CardContent className="space-y-3">
                    {block.exercises.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-content-subtle">
                        Suelta un ejercicio aquí
                      </div>
                    ) : (
                      block.exercises.map((it) => (
                        <div
                          key={it.id}
                          className="rounded-xl border border-line bg-surface p-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="font-medium text-content">{it.name}</p>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                icon={PlayCircle}
                                aria-label="Ver video"
                                onClick={() => setVideo({ name: it.name, url: it.videoUrl })}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                icon={Trash2}
                                aria-label="Quitar ejercicio"
                                onClick={() => removeItem(block.id, it.id)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <Field label="Series">
                              <Input
                                type="number"
                                min={0}
                                value={it.sets}
                                onChange={(e) => updateField(block.id, it.id, "sets", Number(e.target.value))}
                              />
                            </Field>
                            <Field label="Reps">
                              <Input
                                type="number"
                                min={0}
                                value={it.reps}
                                onChange={(e) => updateField(block.id, it.id, "reps", Number(e.target.value))}
                              />
                            </Field>
                            <Field label="RPE">
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={it.rpe}
                                onChange={(e) => updateField(block.id, it.id, "rpe", Number(e.target.value))}
                              />
                            </Field>
                            <Field label="Descanso (s)">
                              <Input
                                type="number"
                                min={0}
                                value={it.restSec}
                                onChange={(e) => updateField(block.id, it.id, "restSec", Number(e.target.value))}
                              />
                            </Field>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button icon={Plus} variant="outline" onClick={addBlock} className="w-full">
                Añadir bloque
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timer">
          <CrossfitTimer />
        </TabsContent>
      </Tabs>

      {/* Modal de video del ejercicio */}
      <Modal
        open={video !== null}
        onClose={() => setVideo(null)}
        title={video?.name}
        description="Demostración técnica del ejercicio."
        size="lg"
      >
        {video?.url ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={video.url}
              title={video.name}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-surface-muted text-sm text-content-subtle">
            Video no disponible para este ejercicio.
          </div>
        )}
      </Modal>
    </>
  );
}
