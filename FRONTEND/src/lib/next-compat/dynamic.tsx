import React, { lazy, Suspense } from "react";

export default function dynamic<T extends React.ComponentType<any> = React.ComponentType<any>>(
  loader: () => Promise<any>,
  options?: { ssr?: boolean; loading?: React.ComponentType },
): React.ComponentType<any> {
  const LazyComponent = lazy(async () => {
    const mod = await loader();
    if (mod && typeof mod === "object" && "default" in mod) return mod;
    return { default: mod };
  });

  const Loading = options?.loading;

  return function DynamicComponent(props: any) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
