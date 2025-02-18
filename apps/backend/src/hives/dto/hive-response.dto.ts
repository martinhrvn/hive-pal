import { BoxDto } from './box.dto';

export class HiveResponseDto {
  id: string;
  name: string;
  apiaryId: string;
  notes: string;
  installationDate: string;
  lastInspectionDate: Date;
  boxes: BoxDto[];
}
