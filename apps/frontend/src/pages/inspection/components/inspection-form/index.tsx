import { useNavigate } from "react-router-dom";
import {
  useHiveControllerFindAll,
  useInspectionsControllerCreate,
} from "api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { InspectionFormData, inspectionSchema } from "./schema";
import { WeatherSection } from "@/pages/inspection/components/inspection-form/weather.tsx";

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
    mutation: { onSuccess: () => navigate(`/hives/${hiveId}`) },
  });

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      hiveId,
      date: new Date(),
    },
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
    <div className={"container mx-auto max-w-xl"}>
      <Card>
        <CardHeader>
          <CardTitle>New inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="hiveId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hive</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? hiveId}
                      >
                        <SelectTrigger className={"w-full"}>
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
                              "w-full pl-3 text-left font-normal",
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
              <hr className={"border-t border-border"} />
              <WeatherSection />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
