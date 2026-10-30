import { getExercise, imageUrl } from "@/lib/exercises";

export function ExerciseThumb({ id, size = 56 }: { id: string; size?: number }) {
  const ex = getExercise(id);
  const src = ex?.images[0];
  return (
    <div className="shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800" style={{ width: size, height: size }}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
      )}
    </div>
  );
}
