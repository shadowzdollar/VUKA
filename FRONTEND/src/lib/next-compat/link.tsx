import React, { forwardRef } from "react";
import { Link as TanstackLink } from "@tanstack/react-router";

export type NextLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string;
  to?: string;
  passHref?: boolean;
  prefetch?: boolean;
};

const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
  { href, to, children, ...props },
  ref,
) {
  const target = href ?? to ?? "/";
  if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:")) {
    return (
      <a ref={ref} href={target} {...props}>
        {children}
      </a>
    );
  }
  return (
    <TanstackLink ref={ref} to={target as any} {...(props as any)}>
      {children}
    </TanstackLink>
  );
});

export default Link;
export { Link };
