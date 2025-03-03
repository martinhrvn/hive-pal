import { InspectionResponseDto } from "api-client";
import {
  addWeeks,
  isWithinInterval,
  subWeeks,
  format,
  formatDistanceToNow,
} from "date-fns";
import { useCallback } from "react";
import { CalendarIcon, ChevronRightIcon } from "lucide-react";
import { Link } from "react-router-dom";

type InspectionTimelineProps = {
  inspections: InspectionResponseDto[];
};
export const InspectionTimeline: React.FC<InspectionTimelineProps> = ({
  inspections,
}) => {
  const formatDate = useCallback((date: Date | string): string => {
    const twoWeehsAgo = subWeeks(new Date(), 2);
    const twoWeeksFromNow = addWeeks(new Date(), 2);

    if (isWithinInterval(date, { start: twoWeehsAgo, end: twoWeeksFromNow })) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, "MMM d");
  }, []);

  const formatTime = useCallback((date: Date | string) => {
    return format(date, "hh:mm a");
  }, []);
  return (
    <div className={"flex flex-col space-y-4"}>
      {inspections.map((inspection) => (
        <div
          key={inspection.id}
          className="flex flex-col rounded-lg ml-8 relative pb-8"
        >
          <div className="absolute left-0 top-8 bottom-0 w-px bg-border -ml-4"></div>
          <div
            className={`absolute left-0 top-0 w-8 h-8 rounded-full bg-secondary shadow-sm flex items-center justify-center -ml-8 `}
          >
            <CalendarIcon size={20} />
          </div>
          <div className="flex items-center space-x-5 ml-4 -mt-2">
            <div className="text-primary text-sm font-semibold">
              {formatDate(inspection.date)}
            </div>
            <div className="text-card text-xs px-4 py-2">
              {formatTime(inspection.date)}
            </div>
            <div className="flex justify-self-end self-end p-2">
              <Link
                to={`/inspections/${inspection.id}`}
                className="text-primary flex items-center space-x-4"
              >
                View <ChevronRightIcon size={16} />
              </Link>
            </div>
          </div>
          <div className="flex-grow ml-4">
            <div className="text-gray-500 text-sm">No description just yet</div>
          </div>
        </div>
      ))}
    </div>
  );
};
