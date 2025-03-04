import {
  useHiveControllerFindOne,
  useInspectionsControllerFindAll,
} from "api-client";
import { useParams, Link } from "react-router-dom";
import { HiveStatus } from "@/pages/hive/components";
import { Section } from "@/components/common/section";
import { buttonVariants } from "@/components/ui/button";
import { InspectionTimeline } from "@/pages/inspection/components/inspection-timeline.tsx";

export const HiveDetailPage = () => {
  const { id: hiveId } = useParams<{ id: string }>();
  const { data: hive, error } = useHiveControllerFindOne(hiveId ?? "", {
    query: {
      select: (data) => data.data,
    },
  });
  const { data: inspections } = useInspectionsControllerFindAll(
    {
      hiveId: hiveId,
    },
    { query: { select: (data) => data.data } },
  );
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <div className="p-4 max-w-xl mx-auto">
        {/* Simple status card */}
        <div className="rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <HiveStatus status={hive?.status} />
            </span>
          </div>
          {hive?.installationDate && (
            <p className="text-sm text-gray-500">
              Installed on{" "}
              {new Date(hive?.installationDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <Section
          title={"Inspections"}
          action={
            <Link
              to={
                hive?.id
                  ? `/hives/${hive.id}/inspections/create`
                  : "/inspections/create"
              }
              className={buttonVariants({ variant: "outline" })}
            >
              + Add inspection
            </Link>
          }
        >
          <InspectionTimeline inspections={inspections ?? []} />
        </Section>
      </div>
    </div>
  );
};
