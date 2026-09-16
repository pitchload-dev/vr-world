import { forwardRef, type AnchorHTMLAttributes } from 'react';

// The downloadable demo has two ordinary document routes and no Next server.
const Link = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  function Link(props, ref) {
    const href =
      typeof props.href === 'string' && props.href.startsWith('/')
        ? props.href === '/'
          ? import.meta.env.BASE_URL
          : import.meta.env.BASE_URL.replace(/\/$/, '') + props.href
        : props.href;
    return <a {...props} href={href} ref={ref} />;
  },
);
export default Link;
