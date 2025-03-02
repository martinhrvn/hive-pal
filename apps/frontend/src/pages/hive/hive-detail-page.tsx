import { useHiveControllerFindOne } from "api-client";
import { useParams } from "react-router-dom";
import { HiveStatus } from "@/components/hive/hive-status.tsx";

export const HiveDetailPage = () => {
  const { id: hiveId } = useParams<{ id: string }>();
  const { data: hive, error } = useHiveControllerFindOne(hiveId ?? "", {
    query: {
      select: (data) => data.data,
    },
  });
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <div className="p-4 max-w-xl mx-auto">
        {/* Basic header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{hive?.name}</h1>
          <p className="text-sm text-gray-500">{hive?.apiaryId}</p>
        </div>

        {/* Simple status card */}
        <div className="rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium">Status</h2>
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
      </div>
    </div>
  );
};
