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
import {
  CalendarIcon,
  Cloud,
  CloudRain,
  CloudSun,
  Sun,
  Thermometer,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const inspectionSchema = z.object({
  hiveId: z.string(),
  date: z.date(),
  temperature: z.number().optional(),
  weatherConditions: z.string().optional(),
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

  const weatherConditions = [
    {
      id: "sunny",
      label: "Sunny",
      icon: Sun,

      style: "bg-background border-border hover:border-amber-800",
      styleActive: "bg-amber-800/20 text-gray-300 border-amber-900",
      iconStyle: "text-amber-800",
      iconStyleActive: "text-amber-300",
    },
    {
      id: "partly-cloudy",
      label: "Partly cloudy",
      icon: CloudSun,
      style: "bg-background border-border hover:border-gray-600",
      styleActive: "bg-gray-800 text-gray-100 border-gray-600",
      iconStyle: "text-amber-800",
      iconStyleActive: "text-amber-400",
    },
    {
      id: "cloudy",
      label: "Cloudy",
      icon: Cloud,
      style: "bg-background border-border hover:border-gray-800",
      styleActive: "bg-gray-800 text-gray-100 border-gray-600",
      iconStyle: "text-gray-800",
      iconStyleActive: "text-gray-200",
    },
    {
      id: "rainy",
      label: "Rainy",
      icon: CloudRain,
      style: "bg-background border-border hover:border-blue-800",
      styleActive: "bg-blue-800/20 text-gray-100 border-blue-900",
      iconStyle: "text-blue-800",
      iconStyleActive: "text-blue-200",
    },
  ];

  return (
    <div className={"container mx-auto"}>
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
              <hr className={"border-t border-border"} />
              <div>
                <h3 className="text-lg font-medium">Wheather information</h3>
                <p className="text-sm text-gray-400">Add weather conditions</p>
                <div className={"space-y-4 py-4"}>
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature</FormLabel>
                        <FormControl>
                          <div className={"relative w-24"}>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Thermometer className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input
                              type="text"
                              placeholder="10"
                              className={"pl-9 no-spinners"}
                              {...field}
                              onChange={(e) => {
                                if (e.target.value === "") {
                                  field.onChange(null);
                                  return;
                                }
                                const value = parseInt(e.target.value);
                                if (
                                  !isNaN(value) &&
                                  value >= -50 &&
                                  value <= 50
                                ) {
                                  field.onChange(value);
                                }
                              }}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center">
                              <span className="text-gray-500 pr-3">°C</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weatherConditions"
                    rules={{ required: "Please select a weather condition" }}
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Condition</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-3 justify-start">
                            {weatherConditions.map((condition) => {
                              const Icon = condition.icon;
                              const isSelected = field.value === condition.id;

                              return (
                                <button
                                  type={"button"}
                                  key={condition.id}
                                  onClick={() => field.onChange(condition.id)}
                                  onKeyDown={() => {}}
                                  className={`
                              flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all
                              ${isSelected ? `${condition.styleActive}` : `${condition.style}`}
                            `}
                                >
                                  <Icon
                                    className={`h-5 w-5 ${isSelected ? condition.iconStyleActive : condition.iconStyle}`}
                                  />
                                  <span className={`text-sm font-medium`}>
                                    {condition.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
