let fontData: ArrayBuffer | null = null;

export async function loadFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;

  const response = await fetch(
    'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf',
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.status}`);
  }
  fontData = await response.arrayBuffer();
  return fontData;
}

let fontBoldData: ArrayBuffer | null = null;

export async function loadBoldFont(): Promise<ArrayBuffer> {
  if (fontBoldData) return fontBoldData;

  const response = await fetch(
    'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf',
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch bold font: ${response.status}`);
  }
  fontBoldData = await response.arrayBuffer();
  return fontBoldData;
}
