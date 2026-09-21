import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Flow = lazy(() => import("./charts").then((m) => ({ default: m.FlowChart })));
const Donut = lazy(() => import("./charts").then((m) => ({ default: m.DonutChart })));
const Histogram = lazy(() => import("./charts").then((m) => ({ default: m.HistogramChart })));
const Trend = lazy(() => import("./charts").then((m) => ({ default: m.TrendChart })));
const Radar = lazy(() => import("./charts").then((m) => ({ default: m.RadarView })));
const State = lazy(() => import("./charts").then((m) => ({ default: m.StateChart })));

/** Charts render client-side only (they measure the DOM) and never block first paint. */
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

const fallback = <Skeleton className="h-56 w-full rounded-none" aria-label="Loading chart" />;

export function LazyFlowChart(props: ComponentProps<typeof Flow>) {
  const mounted = useMounted();
  return mounted ? (
    <Suspense fallback={fallback}>
      <Flow {...props} />
    </Suspense>
  ) : (
    fallback
  );
}

export function LazyStateChart(props: ComponentProps<typeof State>) {
  const mounted = useMounted();
  return mounted ? (
    <Suspense fallback={fallback}>
      <State {...props} />
    </Suspense>
  ) : (
    fallback
  );
}

function lazyChart<P extends object>(Comp: React.ComponentType<P>, height = "h-56") {
  return function Lazy(props: P) {
    const mounted = useMounted();
    return mounted ? (
      <Suspense
        fallback={
          <Skeleton className={`${height} w-full rounded-none`} aria-label="Loading chart" />
        }
      >
        <Comp {...props} />
      </Suspense>
    ) : (
      <Skeleton className={`${height} w-full rounded-none`} aria-label="Loading chart" />
    );
  };
}

export const LazyDonutChart = lazyChart(Donut, "h-44");
export const LazyHistogramChart = lazyChart(Histogram);
export const LazyTrendChart = lazyChart(Trend, "h-64");
export const LazyRadarView = lazyChart(Radar, "h-72");
