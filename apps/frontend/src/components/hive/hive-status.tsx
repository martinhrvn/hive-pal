
import React from 'react';
import { HiveResponseDto } from "api-client";

type HiveStatusEnum = HiveResponseDto['status']

type HiveStatusProps = {
    status: HiveResponseDto['status'];
};

const getStatusClasses = (status: HiveStatusEnum) => {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-700 text-white';
        case 'INACTIVE':
            return 'bg-gray-400 text-white';
        case 'DEAD':
            return 'bg-gray-700 text-white';
        case 'UNKNOWN':
            return 'bg-gray-300 text-gray-900';
        default:
            return 'bg-blue-500 text-white';
    }
};

export const HiveStatus: React.FC<HiveStatusProps> = ({ status }) => {
    return (
        <div
            className={`
        inline-flex
        px-3
        py-1
        rounded-full
        text-sm
        font-medium
        capitalize
        ${getStatusClasses(status)}
      `}
        >
            {status}
        </div>
    );
};