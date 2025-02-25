import {HiveResponseDto} from 'api-client/dist/model';
import { useNavigate} from "react-router-dom";

type HiveListProps = {
    hives: HiveResponseDto[];
}

export const HiveList: React.FC<HiveListProps> = ({ hives }) => {
    const navigate = useNavigate()
    return (
        <div>
            <button onClick={() => navigate('/hive/create/')}>Create hive</button>
            {hives.map((hive) => (
                <div key={hive.id}>
                    <h2>{hive.name}</h2>
                    <p>{hive.notes}</p>
                </div>
            ))}
        </div>
    );
}