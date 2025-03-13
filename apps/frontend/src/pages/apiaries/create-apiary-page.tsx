import { ApiaryForm } from './components/apiary-form';

export const CreateApiaryPage = () => {
  return (
    <div className="flex flex-col space-y-6 p-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Create Apiary</h1>
      <ApiaryForm />
    </div>
  );
};
