import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '../ui/form';
import {useHiveControllerCreate} from "api-client";

const hiveSchema = z.object({
    name: z.string(),
    apiaryId: z.string().optional().transform((value) => value || undefined),
    notes: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    installationDate: z.date().transform((date) => date.toISOString()),
});

type HiveFormData = z.infer<typeof hiveSchema>;

export const HiveForm = () => {
    const {mutate} = useHiveControllerCreate()
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<HiveFormData>({
        resolver: zodResolver(hiveSchema),
    });

    const onSubmit = (data: HiveFormData) => {
        mutate({ data });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
                label="Hive Name"
                isRequired
                {...register('name')}
                error={errors.name}
            />

            <FormInput
                label="Apiary ID"
                {...register('apiaryId')}
                error={errors.apiaryId}
            />

            <FormInput
                label="Notes"
                variant="textarea"
                {...register('notes')}
                error={errors.notes}
            />

            <FormInput
                label="Installation Date"
                type="date"
                isRequired
                {...register('installationDate', {
                    setValueAs: (value) => value ? new Date(value) : null,
                })}
                error={errors.installationDate}
            />

            <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Submit
            </button>
        </form>
    );
};