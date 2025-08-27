import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StickyNote, Save, Trash2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { InspectionFormData } from '../schema';

export type NoteActionType = {
  type: 'NOTE';
  notes: string;
};

interface NoteFormProps {
  onSave: (action: NoteActionType) => void;
  onRemove?: (type: NoteActionType['type']) => void;
}

export const NoteForm: React.FC<NoteFormProps> = ({ onSave, onRemove }) => {
  const { getValues } = useFormContext<InspectionFormData>();
  const existingActions = getValues('actions') || [];
  const existingNote = existingActions.find(a => a.type === 'NOTE') as
    | NoteActionType
    | undefined;

  const [content, setContent] = useState(existingNote?.notes || '');

  const handleSave = () => {
    if (content.trim()) {
      onSave({
        type: 'NOTE',
        notes: content.trim(),
      });
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove('NOTE');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Note
        </CardTitle>
        <CardDescription>
          Add a note or observation about this hive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="note-content">Note Content</Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Enter your note or observation..."
            className="min-h-[120px]"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {content.length}/500 characters
          </p>
        </div>

        <div className="flex justify-end gap-2">
          {existingNote && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
          <Button type="button" onClick={handleSave} disabled={!content.trim()}>
            <Save className="mr-2 h-4 w-4" />
            Save Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface NoteViewProps {
  action: NoteActionType;
  onSave: (action: NoteActionType) => void;
  onRemove?: (type: NoteActionType['type']) => void;
}

export const NoteView: React.FC<NoteViewProps> = ({
  action,
  onSave,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(action.notes);

  const handleSave = () => {
    if (content.trim()) {
      onSave({
        ...action,
        notes: content.trim(),
      });
      setIsEditing(false);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(action.type);
    }
  };

  if (isEditing) {
    return (
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[100px]"
            maxLength={500}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!content.trim()}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Note
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              Remove
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{action.notes}</p>
      </CardContent>
    </Card>
  );
};
