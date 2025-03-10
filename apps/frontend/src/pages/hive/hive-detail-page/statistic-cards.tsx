import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InspectionResponseDto } from "api-client";
import { Activity, Droplets, Egg } from "lucide-react";

type StatisticCardProps = {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
};

const StatisticCard = ({ title, value, subtitle, icon }: StatisticCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

export const StatisticCards = ({ inspections }: { inspections: InspectionResponseDto[] }) => {
  // Sort inspections by date (newest first)
  const sortedInspections = [...inspections].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Find most recent values for each metric
  let strength: number | null = null;
  let honeyStores: number | null = null;
  let cappedBrood: number | null = null;
  let uncappedBrood: number | null = null;
  
  // Track dates for each metric to show when they were last recorded
  let strengthDate: string | null = null;
  let honeyStoresDate: string | null = null;
  let broodDate: string | null = null;
  
  // Go through sorted inspections to find most recent values
  for (const inspection of sortedInspections) {
    const date = new Date(inspection.date).toLocaleDateString();
    
    // Colony strength
    if (strength === null && inspection.observations?.strength !== null) {
      strength = inspection.observations.strength;
      strengthDate = date;
    }
    
    // Honey stores
    if (honeyStores === null && inspection.observations?.honeyStores !== null) {
      honeyStores = inspection.observations.honeyStores;
      honeyStoresDate = date;
    }
    
    // Brood metrics
    if ((cappedBrood === null || uncappedBrood === null) && 
        (inspection.observations?.cappedBrood !== null || 
         inspection.observations?.uncappedBrood !== null)) {
      
      if (cappedBrood === null && inspection.observations?.cappedBrood !== null) {
        cappedBrood = inspection.observations.cappedBrood;
      }
      
      if (uncappedBrood === null && inspection.observations?.uncappedBrood !== null) {
        uncappedBrood = inspection.observations.uncappedBrood;
      }
      
      if (broodDate === null) {
        broodDate = date;
      }
    }
    
    // If we've found all metrics, we can stop searching
    if (strength !== null && honeyStores !== null && 
        cappedBrood !== null && uncappedBrood !== null) {
      break;
    }
  }
  
  // Calculate total brood score (average of capped and uncapped if both exist)
  const broodScore = cappedBrood !== null && uncappedBrood !== null
    ? ((cappedBrood + uncappedBrood) / 2).toFixed(1)
    : cappedBrood !== null 
      ? cappedBrood
      : uncappedBrood;
  
  // Create subtitles with dates for each metric
  const strengthSubtitle = strengthDate ? `Last recorded: ${strengthDate}` : "No data available";
  const honeySubtitle = honeyStoresDate ? `Last recorded: ${honeyStoresDate}` : "No data available";
  const broodSubtitle = broodDate ? `Last recorded: ${broodDate}` : "No data available";

  // Create color classes based on values
  const getStrengthColor = (value: number | null) => {
    if (value === null) return "";
    if (value >= 7) return "text-green-600";
    if (value >= 4) return "text-amber-500";
    return "text-red-500";
  };
  
  const getHoneyColor = (value: number | null) => {
    if (value === null) return "";
    if (value >= 7) return "text-green-600";
    if (value >= 3) return "text-amber-500";
    return "text-red-500";
  };

  const getBroodColor = (value: number | null) => {
    if (value === null) return "";
    if (value >= 6) return "text-green-600";
    if (value >= 3) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatisticCard 
        title="Colony Strength"
        value={<span className={getStrengthColor(strength)}>{strength !== null ? strength : "—"}</span>}
        subtitle={strengthSubtitle}
        icon={<Activity className="h-4 w-4" />}
      />
      <StatisticCard 
        title="Honey Stores" 
        value={<span className={getHoneyColor(honeyStores)}>{honeyStores !== null ? honeyStores : "—"}</span>}
        subtitle={honeySubtitle}
        icon={<Droplets className="h-4 w-4" />}
      />
      <StatisticCard
        title="Brood Development"
        value={<span className={getBroodColor(broodScore as number | null)}>{broodScore !== null ? broodScore : "—"}</span>}
        subtitle={broodSubtitle}
        icon={<Egg className="h-4 w-4" />}
      />
    </div>
  );
};