import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A stack of "paper" layers that tilt in 3D toward the pointer and separate slightly in depth.
 * Purely decorative (aria-hidden by callers when the content is repeated as text). Static for
 * reduced-motion users.
 */
export function Tilt({
  children,
  className,
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || still() || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "rotateY(-6deg) rotateX(4deg)";
  };
  return (
    <div className={cn("stage-3d", className)} onPointerMove={onMove} onPointerLeave={reset}>
      <div ref={ref} className="layer-3d" style={{ transform: "rotateY(-6deg) rotateX(4deg)" }}>
        {children}
      </div>
    </div>
  );
}

/** One sheet inside a <Tilt>, lifted `z` pixels toward the viewer. */
export function Sheet3D({
  z,
  className,
  children,
}: {
  z: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border border-border bg-card shadow-[0_18px_40px_-22px_rgba(0,0,0,0.5)]",
        className,
      )}
      style={{ transform: `translateZ(${z}px)` }}
    >
      {children}
    </div>
  );
}
