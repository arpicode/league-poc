import type { ReactNode } from 'react';

export function PageHeader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <h1 className="h3 mb-0">{title}</h1>
      {children && <div className="d-flex gap-2">{children}</div>}
    </div>
  );
}
