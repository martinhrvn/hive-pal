import React, { useState, useRef, useEffect } from "react";
import { Thermometer, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

interface TemperatureFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  min?: number;
  max?: number;
  defaultValue?: number;
}

const TemperatureField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  field,
  min = -50,
  max = 50,
  defaultValue = 10,
}: TemperatureFieldProps<TFieldValues, TName>) => {
  const [showSlider, setShowSlider] = useState<boolean>(false);
  const [tempValue, setTempValue] = useState<number | null>(
    field.value ?? defaultValue,
  );
  const componentRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        componentRef.current &&
        !componentRef.current.contains(event.target as Node)
      ) {
        setShowSlider(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      field.onChange(null);
      setTempValue(null);
      return;
    }

    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= max) {
      field.onChange(value);
      setTempValue(value);
    }
  };

  const handleSliderChange = (value: number[]) => {
    field.onChange(value[0]);
    setTempValue(value[0]);
  };

  const incrementValue = () => {
    const newValue = Math.min((tempValue ?? 0) + 1, max);
    field.onChange(newValue);
    setTempValue(newValue);
  };

  const decrementValue = () => {
    const newValue = Math.max((tempValue ?? 0) - 1, min);
    field.onChange(newValue);
    setTempValue(newValue);
  };

  // Get color based on temperature value
  const getTemperatureColor = (): string => {
    if (tempValue === null) return "text-gray-400";
    if (tempValue <= -20) return "text-blue-600";
    if (tempValue <= 0) return "text-blue-400";
    if (tempValue <= 15) return "text-green-500";
    if (tempValue <= 30) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space w-full" ref={componentRef}>
      <div className="relative w-full rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Thermometer className={`h-5 w-5 ${getTemperatureColor()}`} />
        </div>
        <Input
          type="number"
          placeholder={defaultValue.toString()}
          className="pl-10 pr-16 rounded-md text-right"
          value={tempValue ?? ""}
          name={field.name}
          onFocus={() => setShowSlider(true)}
          onBlur={() => {
            field.onBlur();
          }}
          onChange={handleInputChange}
          ref={field.ref}
          style={{
            WebkitAppearance: "none",
            MozAppearance: "textfield",
          }}
        />
        <div className="absolute inset-y-0 right-10 flex items-center">
          <span className="text-gray-500 pr-2">°C</span>
        </div>
        <div className="absolute inset-y-0 right-0 flex flex-col h-full">
          <button
            type="button"
            className="h-1/2 px-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={incrementValue}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="h-1/2 px-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={decrementValue}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {showSlider && (
        <div className="px-2 pb-2 pt-5  bg-white border rounded-b-md shadow-sm">
          <Slider
            value={[tempValue ?? defaultValue]}
            min={min}
            max={max}
            step={1}
            onValueChange={handleSliderChange}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{min}°C</span>
            <span>{max}°C</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemperatureField;
