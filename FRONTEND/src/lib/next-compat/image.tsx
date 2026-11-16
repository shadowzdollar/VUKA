import React, { forwardRef } from "react";

export type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  unoptimized?: boolean;
  priority?: boolean;
};

const Image = forwardRef<HTMLImageElement, NextImageProps>(function Image(
  { src, alt = "", width, height, fill, unoptimized: _un, priority: _pr, style, className, ...props },
  ref,
) {
  const combinedStyle = fill
    ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const, ...style }
    : style;

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={combinedStyle}
      className={className}
      {...props}
    />
  );
});

export default Image;
export { Image };
