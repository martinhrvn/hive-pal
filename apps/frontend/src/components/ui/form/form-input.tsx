import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { FieldError } from 'react-hook-form';

interface CommonProps {
  label: string;
  error?: FieldError;
  isRequired?: boolean;
}

type InputProps = CommonProps & {
  variant?: 'input';
  type?: ComponentPropsWithoutRef<'input'>['type'];
} & Omit<ComponentPropsWithoutRef<'input'>, 'type'>;

type TextAreaProps = CommonProps & {
  variant: 'textarea';
  rows?: number;
} & Omit<ComponentPropsWithoutRef<'textarea'>, 'rows'>;

type FormInputProps = InputProps | TextAreaProps;

export const FormInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormInputProps
>(({ label, error, isRequired, variant = 'input', ...props }, ref) => {
  const id = props.id || props.name;

  const inputClassName =
    'mt-1 block w-full rounded-md border border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500';

  const renderInput = () => {
    if (variant === 'textarea') {
      return (
        <textarea
          ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
          id={id}
          rows={(props as TextAreaProps).rows || 3}
          className={inputClassName}
          {...(props as TextAreaProps)}
        />
      );
    }

    return (
      <input
        ref={ref as React.ForwardedRef<HTMLInputElement>}
        id={id}
        type={(props as InputProps).type || 'text'}
        className={inputClassName}
        {...(props as InputProps)}
      />
    );
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
});

FormInput.displayName = 'FormInput';
