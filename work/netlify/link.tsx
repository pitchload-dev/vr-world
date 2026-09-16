import { forwardRef, type AnchorHTMLAttributes } from 'react';

// The downloadable demo has two ordinary document routes and no Next server.
const Link = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  function Link(props, ref) {
    return <a {...props} ref={ref} />;
  },
);
export default Link;
