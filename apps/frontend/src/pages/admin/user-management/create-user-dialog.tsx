import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import { Loader2, MailCheck } from 'lucide-react';
import {
  AdminCreateUser,
  AdminUser,
  PASSWORD_MIN_LENGTH,
  userRoleSchema,
} from 'shared-schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiErrorMessage } from '@/api/api-error-message';
import { CopyButton, PasswordField } from './password-field';
import { generatePassword } from './generate-password';

/** Hours an emailed setup link stays valid (SETUP_LINK_TTL_HOURS on the API). */
const SETUP_LINK_HOURS = 72;

type Credential = AdminCreateUser['credential'];

interface CreateUserDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Whether the server can send email, which setup links need. */
  readonly mailEnabled: boolean;
  readonly onCreate: (input: AdminCreateUser) => Promise<AdminUser>;
}

/** What the admin needs to hand over once the account exists. */
type Created = { email: string } & (
  { credential: 'password'; password: string } | { credential: 'setupLink' }
);

/**
 * Creates an account on the admin's behalf. The form is remounted on every
 * open (new `key`) so a previous draft or one-time password never reappears;
 * it stays mounted while the dialog animates closed.
 */
export function CreateUserDialog({
  open,
  onOpenChange,
  mailEnabled,
  onCreate,
}: CreateUserDialogProps) {
  const { t } = useTranslation('admin');
  const [formKey, setFormKey] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setFormKey(key => key + 1);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-test="create-user-dialog">
        <DialogHeader>
          <DialogTitle>{t('users.create.title')}</DialogTitle>
          <DialogDescription>{t('users.create.description')}</DialogDescription>
        </DialogHeader>
        <CreateUserForm
          key={formKey}
          mailEnabled={mailEnabled}
          onCreate={onCreate}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CreateUserForm({
  mailEnabled,
  onCreate,
  onDone,
}: Readonly<{
  mailEnabled: boolean;
  onCreate: CreateUserDialogProps['onCreate'];
  onDone: () => void;
}>) {
  const { t } = useTranslation(['admin', 'common']);
  const [created, setCreated] = useState<Created | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(1, t('users.create.errors.nameRequired')),
          email: z.email(t('users.create.errors.emailInvalid')),
          role: userRoleSchema,
          credential: z.enum(['password', 'setupLink']),
          password: z.string(),
        })
        .refine(
          v =>
            v.credential !== 'password' ||
            v.password.length >= PASSWORD_MIN_LENGTH,
          {
            path: ['password'],
            message: t('resetPasswordDialog.minCharacters', {
              count: PASSWORD_MIN_LENGTH,
            }),
          },
        ),
    [t],
  );
  type FormValues = z.infer<typeof schema>;

  const [initialPassword] = useState(generatePassword);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      role: 'USER',
      credential: 'password',
      password: initialPassword,
    },
  });
  const credential = useWatch({ control: form.control, name: 'credential' });

  const submit = async (values: FormValues) => {
    setSubmitError(null);
    const base = { name: values.name, email: values.email, role: values.role };
    const input: AdminCreateUser =
      values.credential === 'password'
        ? { ...base, credential: 'password', password: values.password }
        : { ...base, credential: 'setupLink' };
    try {
      const user = await onCreate(input);
      setCreated(
        input.credential === 'password'
          ? {
              email: user.email,
              credential: 'password',
              password: input.password,
            }
          : { email: user.email, credential: 'setupLink' },
      );
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        form.setError('email', {
          message: t('users.create.errors.emailTaken'),
        });
        return;
      }
      setSubmitError(apiErrorMessage(error, t('messages.unexpectedError')));
    }
  };

  if (created) {
    return <CreatedSummary created={created} onDone={onDone} />;
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(submit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('users.create.name')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="off"
                  data-test="create-user-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('table.email')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="off"
                  data-test="create-user-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('table.role')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger
                    className="w-full"
                    data-test="create-user-role"
                  >
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USER">{t('users.roles.USER')}</SelectItem>
                  <SelectItem value="ADMIN">
                    {t('users.roles.ADMIN')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="credential"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('users.create.credential')}</FormLabel>
              <Tabs
                value={field.value}
                onValueChange={value => field.onChange(value as Credential)}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="password" data-test="credential-password">
                    {t('users.create.credentialPassword')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="setupLink"
                    disabled={!mailEnabled}
                    data-test="credential-setup-link"
                  >
                    {t('users.create.credentialSetupLink')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {!mailEnabled && (
                <FormDescription data-test="mail-disabled-hint">
                  {t('users.create.mailDisabled')}
                </FormDescription>
              )}
            </FormItem>
          )}
        />

        {credential === 'password' ? (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('resetPasswordDialog.tempPasswordLabel')}
                </FormLabel>
                <FormControl>
                  <PasswordField
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    onValueChange={field.onChange}
                    data-test="create-user-password"
                  />
                </FormControl>
                <FormDescription>
                  {t('users.create.passwordHint')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('users.create.setupLinkHint', { hours: SETUP_LINK_HOURS })}
          </p>
        )}

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            data-test="create-user-submit"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            {t('users.create.submit')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function CreatedSummary({
  created,
  onDone,
}: Readonly<{ created: Created; onDone: () => void }>) {
  const { t } = useTranslation(['admin', 'common']);
  return (
    <div className="space-y-4" data-test="create-user-result">
      {created.credential === 'password' ? (
        <>
          <p className="text-sm">
            {t('users.create.createdPassword', { email: created.email })}
          </p>
          <div className="flex gap-2">
            <code
              className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm"
              data-test="created-password"
            >
              {created.password}
            </code>
            <CopyButton value={created.password} />
          </div>
        </>
      ) : (
        <p className="flex items-center gap-2 text-sm">
          <MailCheck className="size-4 text-success" aria-hidden />
          {t('users.create.createdSetupLink', { email: created.email })}
        </p>
      )}
      <DialogFooter>
        <Button type="button" onClick={onDone} data-test="create-user-done">
          {t('common:actions.close')}
        </Button>
      </DialogFooter>
    </div>
  );
}
