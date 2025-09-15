import { ParsedReleaseNote } from '@/types/release-notes';

// Import all release notes at build time
const releaseNotesModules = import.meta.glob('/src/releases/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export const parseMarkdownContent = (
  content: string,
): { title: string; releaseDate: string; htmlContent: string } => {
  const lines = content.split('\n');
  const titleLine = lines.find(line => line.startsWith('# '));
  const releaseDateLine = lines.find(line => line.startsWith('**Released:**'));

  const title = titleLine?.replace('# ', '').trim() || '';
  const releaseDate =
    releaseDateLine?.replace('**Released:**', '').trim() || '';

  // Simple markdown to HTML conversion for basic formatting
  const htmlContent = content
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.+):\*\* (.+)$/gm, '<p><strong>$1:</strong> $2</p>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(?!<[hul]|<p|<strong)(.+)$/gm, '<p>$1</p>')
    .replace(/^\s*$/gm, '');

  return { title, releaseDate, htmlContent };
};

export const extractVersionFromFilename = (filename: string): string => {
  const match = filename.match(/\/v?(.+)\.md$/);
  return match ? match[1] : '';
};

export const loadAllReleaseNotes = async (): Promise<ParsedReleaseNote[]> => {
  const releaseNotes: ParsedReleaseNote[] = [];

  for (const [path, loader] of Object.entries(releaseNotesModules)) {
    try {
      const content = await loader();
      const version = extractVersionFromFilename(path);
      const { title, releaseDate, htmlContent } = parseMarkdownContent(content);

      releaseNotes.push({
        version,
        releaseDate,
        content,
        title,
        htmlContent,
      });
    } catch (error) {
      console.warn(`Failed to load release notes from ${path}:`, error);
    }
  }

  // Sort by version (latest first)
  return releaseNotes.sort((a, b) => {
    const aVersion = a.version.split('.').map(Number);
    const bVersion = b.version.split('.').map(Number);

    for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
      const aPart = aVersion[i] || 0;
      const bPart = bVersion[i] || 0;
      if (aPart !== bPart) {
        return bPart - aPart; // Descending order
      }
    }
    return 0;
  });
};

export const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    if (v1Part !== v2Part) {
      return v1Part - v2Part;
    }
  }
  return 0;
};

export const getLatestVersion = (versions: string[]): string => {
  if (versions.length === 0) return '';

  return versions.reduce((latest, current) => {
    return compareVersions(current, latest) > 0 ? current : latest;
  });
};
