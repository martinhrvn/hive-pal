import React from "react";
import { HiveResponseDto } from "api-client";

type HiveStatusEnum = HiveResponseDto["status"];

type HiveStatusProps = {
  status?: HiveResponseDto["status"];
};

const getStatusClasses = (status: HiveStatusEnum) => {
  switch (status) {
    case "ACTIVE":
      return "text-green-600 bg-green-400/10 ring-green-400/30";
    case "INACTIVE":
      return "text-gray-600 bg-gray-400/10 ring-gray-400/30";
    case "DEAD":
      return "bg-gray-700 text-white";
    case "UNKNOWN":
      return "bg-gray-300 text-gray-900";
    default:
      return "bg-blue-500 text-white";
  }
};

export const HiveStatus: React.FC<HiveStatusProps> = ({ status }) => {
  if (!status) {
    return null;
  }
  return (
    <span
      className={`
        whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset
        capitalize
        ${getStatusClasses(status)}
      `}
    >
      {status}
    </span>
  );
};
