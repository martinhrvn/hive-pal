import React, { ReactNode } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

interface FormTestWrapperProps {
  defaultValues?: Record<string, any>;
  children: ReactNode;
}

export const FormTestWrapper = ({
  defaultValues = {},
  children,
}: FormTestWrapperProps) => {
  const methods = useForm({ defaultValues });

  return <FormProvider {...methods}>{children}</FormProvider>;
};