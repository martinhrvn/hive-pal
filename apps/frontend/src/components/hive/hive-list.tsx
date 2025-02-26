import {HiveResponseDto} from 'api-client/dist/model';
import { useNavigate} from "react-router-dom";
import { HiveStatus } from './hive-status';

type HiveListProps = {
    hives: HiveResponseDto[];
}

export const HiveList: React.FC<HiveListProps> = ({ hives }) => {
    const navigate = useNavigate()
    return (
        <div>
            <button onClick={() => navigate('/hive/create/')}>Create hive</button>
            {hives.map((hive) => (
                <div key={hive.id} className="border p-4 my-4 rounded-lg">
                    <h2 className={'text-xl'}>{hive.name}</h2>
                    <p>{hive.notes}</p>
                    <HiveStatus status={hive.status} />
                </div>
            ))}
        </div>
    );
}