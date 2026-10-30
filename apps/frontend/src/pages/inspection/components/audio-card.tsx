import { useState, useCallback, useEffect } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { InspectionSection } from './inspection-section';
import { AudioPlayer } from '@/components/audio';
import {
  useInspectionAudio,
  useDeleteInspectionAudio,
  getAudioDownloadUrl,
} from '@/api/hooks/useInspectionAudio';
import {
  useStartInspectionAudioAi,
  useInspectionAudioAiStatus,
  useInspectionAudioAiResult,
  useUpdateInspectionAudioTranscription,
} from '@/api/hooks/useInspectionAudioAi';
import { useWorkerStatus } from '@/api/hooks/useWorkerTokens';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

interface AudioCardProps {
  inspectionId: string;
}

type RecordingAiStatus =
  'NONE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

type CopyState = 'idle' | 'copied' | 'error';

/** ✅ FIXED: replaces `any` */
type InspectionAiResult = {
  error?: unknown;
  transcript?: {
    text?: string | null;
  } | null;
  inspectionDraft?: unknown;
};

interface RecordingRowProps {
  inspectionId: string;
  recording: {
    id: string;
    fileName: string;
    duration?: number | null;
    transcriptionStatus?: RecordingAiStatus;
    analysisStatus?: RecordingAiStatus;
    transcription?: string | null;
  };
  getDownloadUrl: (audioId: string) => Promise<string>;
  onDelete: (audioId: string) => Promise<void>;
  isDeleting: boolean;
}

/** Returns the `inspection:audioCard.stage.*` key for the combined status. */
function deriveStageLabelKey(
  transcriptionStatus: RecordingAiStatus,
  analysisStatus: RecordingAiStatus,
): string {
  if (transcriptionStatus === 'FAILED') return 'transcriptionFailed';
  if (analysisStatus === 'FAILED') return 'analysisFailed';
  if (transcriptionStatus === 'PENDING') return 'waitingToTranscribe';
  if (transcriptionStatus === 'PROCESSING') return 'transcribing';
  if (analysisStatus === 'PENDING') return 'waitingToAnalyze';
  if (analysisStatus === 'PROCESSING') return 'analyzing';
  if (analysisStatus === 'COMPLETED') return 'completed';
  if (transcriptionStatus === 'COMPLETED' && analysisStatus === 'NONE')
    return 'transcribed';
  return 'idle';
}

/** Returns the `inspection:audioCard.analyze.*` key for the analyze button. */
function getAnalyzeButtonLabelKey(
  isPending: boolean,
  status: RecordingAiStatus,
): string {
  if (isPending) return 'starting';
  if (status === 'PENDING') return 'queued';
  if (status === 'PROCESSING') return 'analyzing';
  return 'start';
}

function getSafeJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

function scheduleCopyStateReset(setter: (value: CopyState) => void) {
  window.setTimeout(() => setter('idle'), 1500);
}

function AiPanel({
  effectiveStatus,
  stageLabel,
  showWaitingForWorker,
  showAiOutput,
  setShowAiOutput,
  aiResult,
  transcriptText,
  copyTranscriptState,
  copyJsonState,
  handleCopyTranscript,
  handleCopyJson,
  statusQueryError,
  isLoadingResult,
  isEditing,
  editValue,
  setEditValue,
  startEditing,
  cancelEditing,
  saveEditing,
  isSaving,
  saveError,
}: {
  effectiveStatus: RecordingAiStatus;
  stageLabel: string;
  showWaitingForWorker: boolean;
  showAiOutput: boolean;
  setShowAiOutput: React.Dispatch<React.SetStateAction<boolean>>;
  aiResult: InspectionAiResult | undefined;
  transcriptText: string;
  copyTranscriptState: CopyState;
  copyJsonState: CopyState;
  handleCopyTranscript: () => Promise<void>;
  handleCopyJson: () => Promise<void>;
  statusQueryError?: string | null;
  isLoadingResult: boolean;
  isEditing: boolean;
  editValue: string;
  setEditValue: (value: string) => void;
  startEditing: () => void;
  cancelEditing: () => void;
  saveEditing: () => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
}) {
  const { t } = useTranslation(['inspection', 'common']);
  const shouldShowLoading =
    showAiOutput && effectiveStatus === 'COMPLETED' && isLoadingResult;

  const structuredJson = getSafeJson(aiResult?.inspectionDraft ?? aiResult);

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{t('inspection:audioCard.aiOutput')}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAiOutput(prev => !prev)}
        >
          {showAiOutput
            ? t('inspection:audioCard.hide')
            : t('inspection:audioCard.show')}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {t('inspection:audioCard.status', { status: stageLabel })}
      </div>

      {showWaitingForWorker && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
          {t('inspection:audioCard.noWorker')}
        </div>
      )}

      {effectiveStatus === 'FAILED' && (
        <div className="text-sm text-red-600">
          {t('inspection:audioCard.analysisFailed', {
            error: statusQueryError ?? t('inspection:audioCard.unknownError'),
          })}
        </div>
      )}

      {showAiOutput && aiResult && (
        <>
          {aiResult?.error && (
            <div className="text-sm text-yellow-600">
              {t('inspection:audioCard.structuringFailed')}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-sm font-medium">
                {t('inspection:audioCard.transcript')}
              </h5>
              <div className="flex gap-2">
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startEditing}
                    disabled={
                      effectiveStatus === 'PENDING' ||
                      effectiveStatus === 'PROCESSING' ||
                      !transcriptText
                    }
                  >
                    {t('inspection:audioCard.editTranscript')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTranscript}
                  disabled={!transcriptText || isEditing}
                >
                  {copyTranscriptState === 'copied'
                    ? t('inspection:audioCard.copied')
                    : copyTranscriptState === 'error'
                      ? t('inspection:audioCard.copyFailed')
                      : t('inspection:audioCard.copyTranscript')}
                </Button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  rows={8}
                  disabled={isSaving}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void saveEditing()}
                    disabled={isSaving || !editValue.trim()}
                  >
                    {isSaving
                      ? t('inspection:form.saving')
                      : t('inspection:audioCard.saveAndReanalyze')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={isSaving}
                  >
                    {t('common:actions.cancel')}
                  </Button>
                </div>
                {saveError && (
                  <div className="text-sm text-red-600">{saveError}</div>
                )}
              </div>
            ) : (
              <div className="whitespace-pre-wrap rounded bg-muted p-3 text-sm">
                {transcriptText || t('inspection:audioCard.noTranscript')}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-sm font-medium">
                {t('inspection:audioCard.structuredJson')}
              </h5>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyJson}
              >
                {copyJsonState === 'copied'
                  ? t('inspection:audioCard.copied')
                  : copyJsonState === 'error'
                    ? t('inspection:audioCard.copyFailed')
                    : t('inspection:audioCard.copyJson')}
              </Button>
            </div>

            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
              {structuredJson}
            </pre>
          </div>

          <details className="rounded-md border p-3 text-xs">
            <summary className="cursor-pointer font-medium">
              {t('inspection:audioCard.debugRaw')}
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap">
              {getSafeJson(aiResult)}
            </pre>
          </details>
        </>
      )}

      {shouldShowLoading && (
        <div className="text-sm text-muted-foreground">
          {t('inspection:audioCard.loadingResult')}
        </div>
      )}
    </div>
  );
}

function RecordingRow({
  inspectionId,
  recording,
  getDownloadUrl,
  onDelete,
  isDeleting,
}: RecordingRowProps) {
  const { t } = useTranslation('inspection');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [showAiOutput, setShowAiOutput] = useState(false);
  const [isPollingEnabled, setIsPollingEnabled] = useState(
    recording.transcriptionStatus !== undefined &&
      recording.transcriptionStatus !== 'NONE',
  );
  const [copyTranscriptState, setCopyTranscriptState] =
    useState<CopyState>('idle');
  const [copyJsonState, setCopyJsonState] = useState<CopyState>('idle');
  const [prefillMessage, setPrefillMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const startAiMutation = useStartInspectionAudioAi(inspectionId, recording.id);

  const updateTranscriptionMutation = useUpdateInspectionAudioTranscription(
    inspectionId,
    recording.id,
  );

  const statusQuery = useInspectionAudioAiStatus(
    inspectionId,
    recording.id,
    isPollingEnabled,
  );

  const transcriptionStatus: RecordingAiStatus =
    statusQuery.data?.transcriptionStatus ??
    recording.transcriptionStatus ??
    'NONE';
  const analysisStatus: RecordingAiStatus =
    statusQuery.data?.analysisStatus ?? recording.analysisStatus ?? 'NONE';

  // Combined status — what the rest of the UI cares about. COMPLETED only when
  // both stages are done.
  const effectiveStatus: RecordingAiStatus =
    transcriptionStatus === 'FAILED' || analysisStatus === 'FAILED'
      ? 'FAILED'
      : analysisStatus === 'COMPLETED'
        ? 'COMPLETED'
        : transcriptionStatus === 'PROCESSING' ||
            analysisStatus === 'PROCESSING'
          ? 'PROCESSING'
          : transcriptionStatus === 'PENDING' || analysisStatus === 'PENDING'
            ? 'PENDING'
            : transcriptionStatus;

  const stageLabel = t(
    `audioCard.stage.${deriveStageLabelKey(transcriptionStatus, analysisStatus)}`,
  );

  const { data: workerStatus } = useWorkerStatus();
  const showWaitingForWorker =
    (transcriptionStatus === 'PENDING' || analysisStatus === 'PENDING') &&
    (workerStatus?.workersOnline ?? 0) === 0;

  const resultQuery = useInspectionAudioAiResult(
    inspectionId,
    recording.id,
    analysisStatus === 'COMPLETED',
  );

  const navigate = useNavigate();

  const aiResult = resultQuery.data;
  const transcriptText = aiResult?.transcript?.text ?? '';

  const shouldShowAiPanel =
    effectiveStatus !== 'NONE' || isPollingEnabled || Boolean(aiResult);

  useEffect(() => {
    let cancelled = false;

    const loadUrl = async () => {
      if (audioUrl) return;

      setIsLoadingUrl(true);
      try {
        const url = await getDownloadUrl(recording.id);
        if (!cancelled) {
          setAudioUrl(url);
        }
      } catch (error) {
        console.error('Failed to get audio URL:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingUrl(false);
        }
      }
    };

    void loadUrl();

    return () => {
      cancelled = true;
    };
  }, [audioUrl, getDownloadUrl, recording.id]);

  useEffect(() => {
    if (effectiveStatus === 'COMPLETED' || effectiveStatus === 'FAILED') {
      setShowAiOutput(true);
    }
  }, [effectiveStatus]);

  useEffect(() => {
    const isFinished =
      effectiveStatus === 'COMPLETED' || effectiveStatus === 'FAILED';

    if (isPollingEnabled && isFinished) {
      setIsPollingEnabled(false);
    }
  }, [effectiveStatus, isPollingEnabled]);

  const handlePrefillInspection = () => {
    if (!aiResult?.inspectionDraft) {
      setPrefillMessage(t('audioCard.runAnalysisFirst'));
      window.setTimeout(() => setPrefillMessage(null), 2000);
      return;
    }

    navigate(`/inspections/${inspectionId}/edit?from=ai`, {
      state: {
        aiDraft: aiResult.inspectionDraft,
        aiSourceAudioId: recording.id,
      },
    });
  };

  const handleCopyTranscript = async () => {
    if (!transcriptText) return;

    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopyTranscriptState('copied');
    } catch (error) {
      console.error('Failed to copy transcript:', error);
      setCopyTranscriptState('error');
    } finally {
      scheduleCopyStateReset(setCopyTranscriptState);
    }
  };

  const handleCopyJson = async () => {
    const json = getSafeJson(aiResult?.inspectionDraft ?? aiResult);

    try {
      await navigator.clipboard.writeText(json);
      setCopyJsonState('copied');
    } catch (error) {
      console.error('Failed to copy JSON:', error);
      setCopyJsonState('error');
    } finally {
      scheduleCopyStateReset(setCopyJsonState);
    }
  };

  const startEditing = () => {
    setEditValue(transcriptText);
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue('');
    setSaveError(null);
  };

  const saveEditing = async () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setSaveError(t('audioCard.transcriptEmpty'));
      return;
    }
    try {
      await updateTranscriptionMutation.mutateAsync(trimmed);
      setIsEditing(false);
      setEditValue('');
      setSaveError(null);
      setIsPollingEnabled(true);
      setShowAiOutput(true);
    } catch (error) {
      console.error('Failed to save transcript:', error);
      setSaveError(t('audioCard.saveTranscriptFailed'));
    }
  };

  const handleAnalyze = async () => {
    try {
      await startAiMutation.mutateAsync();
      setIsPollingEnabled(true);
      setShowAiOutput(true);
    } catch (error) {
      console.error('AI analysis failed to start:', error);
      alert(t('audioCard.startFailed'));
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      {audioUrl ? (
        <AudioPlayer
          src={audioUrl}
          fileName={recording.fileName}
          duration={recording.duration ?? undefined}
          onDelete={() => onDelete(recording.id)}
          onDownload={() =>
            window.open(audioUrl, '_blank', 'noopener,noreferrer')
          }
          isDeleting={isDeleting}
        />
      ) : (
        <div className="text-sm text-muted-foreground">
          {isLoadingUrl
            ? t('audioCard.loadingAudio')
            : t('audioCard.preparingAudio')}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleAnalyze}
            disabled={
              startAiMutation.isPending ||
              effectiveStatus === 'PROCESSING' ||
              effectiveStatus === 'PENDING'
            }
          >
            {t(
              `audioCard.analyze.${getAnalyzeButtonLabelKey(startAiMutation.isPending, effectiveStatus)}`,
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handlePrefillInspection}
          >
            {t('audioCard.prefill')}
          </Button>
        </div>

        {prefillMessage && (
          <div className="text-sm text-muted-foreground">{prefillMessage}</div>
        )}
      </div>

      {shouldShowAiPanel && (
        <AiPanel
          effectiveStatus={effectiveStatus}
          stageLabel={stageLabel}
          showWaitingForWorker={showWaitingForWorker}
          showAiOutput={showAiOutput}
          setShowAiOutput={setShowAiOutput}
          aiResult={aiResult}
          transcriptText={transcriptText}
          copyTranscriptState={copyTranscriptState}
          copyJsonState={copyJsonState}
          handleCopyTranscript={handleCopyTranscript}
          handleCopyJson={handleCopyJson}
          statusQueryError={statusQuery.data?.analysisError}
          isLoadingResult={resultQuery.isLoading}
          isEditing={isEditing}
          editValue={editValue}
          setEditValue={setEditValue}
          startEditing={startEditing}
          cancelEditing={cancelEditing}
          saveEditing={saveEditing}
          isSaving={updateTranscriptionMutation.isPending}
          saveError={saveError}
        />
      )}
    </div>
  );
}

export function AudioCard({ inspectionId }: AudioCardProps) {
  const { t } = useTranslation('inspection');
  const { data: recordings = [], isLoading } = useInspectionAudio(inspectionId);
  const deleteAudio = useDeleteInspectionAudio(inspectionId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (audioId: string) => {
      setDeletingId(audioId);
      try {
        await deleteAudio.mutateAsync(audioId);
      } finally {
        setDeletingId(null);
      }
    },
    [deleteAudio],
  );

  const getDownloadUrl = useCallback(
    async (audioId: string) => getAudioDownloadUrl(inspectionId, audioId),
    [inspectionId],
  );

  if (!isLoading && recordings.length === 0) {
    return null;
  }

  return (
    <InspectionSection
      title={t('audioCard.title')}
      icon={<Mic className="h-4 w-4" />}
      trailing={
        recordings.length > 0 ? (
          <span className="font-overline tabular-nums text-stone-400">
            {t('audioCard.recordings', { count: recordings.length })}
          </span>
        ) : null
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-stone-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {recordings.map(recording => (
            <RecordingRow
              key={recording.id}
              inspectionId={inspectionId}
              recording={recording}
              getDownloadUrl={getDownloadUrl}
              onDelete={handleDelete}
              isDeleting={deletingId === recording.id}
            />
          ))}
        </div>
      )}
    </InspectionSection>
  );
}
