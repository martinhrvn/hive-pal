import {useHiveControllerFindAll} from "api-client";
import {HiveList} from "@/components/hive/hive-list.tsx";

export const HomePage = () => {
    const { data, isLoading } = useHiveControllerFindAll()

    if (isLoading) {
        return <div>Loading...</div>
    }

    return <HiveList hives={data?.data ?? []} />
}