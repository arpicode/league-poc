import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  name: string;
  error?: string;
  /** Renders a custom control (e.g. a select) instead of an input; it receives the generated id. */
  children?: (props: { id: string; className: string; 'aria-invalid': boolean }) => ReactNode;
}

export function FormField({ label, name, error, children, className, ...inputProps }: Props) {
  const id = useId();
  const invalid = Boolean(error);
  const controlProps = { id, 'aria-invalid': invalid };

  return (
    <div className={className ?? 'mb-3'}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children ? (
        children({ ...controlProps, className: `form-select${invalid ? ' is-invalid' : ''}` })
      ) : (
        <input
          {...inputProps}
          {...controlProps}
          name={name}
          className={`form-control${invalid ? ' is-invalid' : ''}`}
        />
      )}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
