import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useHiveControllerFindAll,
  useInspectionsControllerCreate,
} from "api-client";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inspectionSchema = z.object({
  hiveId: z.string(),
  date: z.date(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

type InspectionFormProps = {
  hiveId?: string;
};
export const InspectionForm: React.FC<InspectionFormProps> = ({ hiveId }) => {
  const navigate = useNavigate();
  const { data: hives } = useHiveControllerFindAll({
    query: {
      select: (data) =>
        data.data.map((hive) => ({
          value: hive.id,
          label: hive.name,
        })),
    },
  });

  const { mutate } = useInspectionsControllerCreate({
    mutation: { onSuccess: () => navigate("/") },
  });

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
  });

  const onSubmit = (data: InspectionFormData) => {
    mutate({
      data: {
        ...data,
        date: data.date.toISOString(),
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="hiveId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? hiveId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={"Select a hive"} />
                  </SelectTrigger>
                  <SelectContent>
                    {hives?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Installation date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
