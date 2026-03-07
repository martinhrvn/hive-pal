import { Injectable } from '@nestjs/common';
import satori from 'satori';
import sharp from 'sharp';
import { loadFont, loadBoldFont } from './font';
import { LOGO_BASE64 } from './logo-base64';
import { SharedResourceResponse, ShareResourceType } from 'shared-schemas';

@Injectable()
export class ShareImageService {
  async generateImage(data: SharedResourceResponse): Promise<Buffer> {
    const svg =
      data.resourceType === ShareResourceType.HARVEST
        ? await this.generateHarvestSvg(data)
        : await this.generateInspectionSvg(data);

    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  private async generateHarvestSvg(
    data: Extract<SharedResourceResponse, { resourceType: 'HARVEST' }>,
  ): Promise<string> {
    const [font, fontBold] = await Promise.all([loadFont(), loadBoldFont()]);

    const date = new Date(data.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const weightDisplay = data.totalWeight
      ? `${data.totalWeight} ${data.totalWeightUnit}`
      : 'In progress';

    return satori(
      {
        type: 'div',
        props: {
          style: {
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            background:
              'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
            padding: '48px',
            fontFamily: 'Inter',
            color: '#ffffff',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '32px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      },
                      children: [
                        {
                          type: 'img',
                          props: {
                            src: LOGO_BASE64,
                            width: 48,
                            height: 48,
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '36px', fontWeight: 700 },
                            children: 'Hive Pal',
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '20px',
                        opacity: 0.9,
                        background: 'rgba(255,255,255,0.2)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                      },
                      children: date,
                    },
                  },
                ],
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '48px',
                  fontWeight: 700,
                  marginBottom: '8px',
                },
                children: `Harvest: ${weightDisplay}`,
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '24px',
                  opacity: 0.9,
                  marginBottom: '32px',
                },
                children: data.apiaryName,
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1,
                },
                children: data.harvestHives.slice(0, 5).map((hh) => ({
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.15)',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontSize: '20px',
                    },
                    children: [
                      { type: 'span', props: { children: hh.hiveName } },
                      {
                        type: 'span',
                        props: {
                          style: { fontWeight: 700 },
                          children: hh.honeyAmount
                            ? `${hh.honeyAmount} ${hh.honeyAmountUnit || 'kg'}`
                            : `${hh.framesTaken} frames`,
                        },
                      },
                    ],
                  },
                })),
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '24px',
                  fontSize: '18px',
                  opacity: 0.7,
                },
                children: 'hivepal.app',
              },
            },
          ],
        },
      } as any,
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Inter', data: font, weight: 400, style: 'normal' as const },
          {
            name: 'Inter',
            data: fontBold,
            weight: 700,
            style: 'normal' as const,
          },
        ],
      },
    );
  }

  private async generateInspectionSvg(
    data: Extract<SharedResourceResponse, { resourceType: 'INSPECTION' }>,
  ): Promise<string> {
    const [font, fontBold] = await Promise.all([loadFont(), loadBoldFont()]);

    const date = new Date(data.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const weatherParts = [
      data.temperature !== null ? `${data.temperature}°C` : null,
      data.weatherConditions,
    ].filter(Boolean);
    const weatherInfo = weatherParts.length > 0 ? weatherParts.join(' • ') : '';

    const titleChildren: unknown[] = [
      {
        type: 'div',
        props: {
          style: { fontSize: '48px', fontWeight: 700 },
          children: `Inspection: ${data.hiveName}`,
        },
      },
    ];

    const bodyChildren: unknown[] = [];

    if (weatherInfo) {
      bodyChildren.push({
        type: 'div',
        props: {
          style: { fontSize: '22px', opacity: 0.9, marginBottom: '16px' },
          children: weatherInfo,
        },
      });
    }

    // Score cards row
    if (data.scores) {
      const scoreItems = [
        { label: 'Overall', value: data.scores.overallScore },
        { label: 'Population', value: data.scores.populationScore },
        { label: 'Stores', value: data.scores.storesScore },
        { label: 'Queen', value: data.scores.queenScore },
      ];

      bodyChildren.push({
        type: 'div',
        props: {
          style: {
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            marginRight: '25px',
            paddingRight: '25px',
          },
          children: scoreItems.map((s) => ({
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.2)',
                padding: '12px 0',
                borderRadius: '12px',
                flex: 1,
                minWidth: 0,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '14px', opacity: 0.8 },
                    children: s.label,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '32px', fontWeight: 700 },
                    children:
                      s.value !== null
                        ? `${Math.round(s.value * 10) / 10}`
                        : '–',
                  },
                },
              ],
            },
          })),
        },
      });
    }

    bodyChildren.push({
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          flex: 1,
        },
        children: data.observations.slice(0, 6).map((obs) => ({
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.15)',
              padding: '12px 20px',
              borderRadius: '8px',
              width: '31%',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: '14px', opacity: 0.8 },
                  children: obs.type
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '22px', fontWeight: 700 },
                  children: this.getObservationValue(obs),
                },
              },
            ],
          },
        })),
      },
    });

    return satori(
      {
        type: 'div',
        props: {
          style: {
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            background:
              'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
            padding: '48px',
            fontFamily: 'Inter',
            color: '#ffffff',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '32px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      },
                      children: [
                        {
                          type: 'img',
                          props: {
                            src: LOGO_BASE64,
                            width: 48,
                            height: 48,
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '36px', fontWeight: 700 },
                            children: 'Hive Pal',
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '20px',
                        opacity: 0.9,
                        background: 'rgba(255,255,255,0.2)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                      },
                      children: date,
                    },
                  },
                ],
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                },
                children: titleChildren,
              },
            },
            ...bodyChildren,
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '24px',
                  fontSize: '18px',
                  opacity: 0.7,
                },
                children: 'hivepal.app',
              },
            },
          ],
        },
      } as any,
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Inter', data: font, weight: 400, style: 'normal' as const },
          {
            name: 'Inter',
            data: fontBold,
            weight: 700,
            style: 'normal' as const,
          },
        ],
      },
    );
  }

  private getObservationValue(obs: {
    numericValue?: number | null;
    textValue?: string | null;
    booleanValue?: boolean | null;
  }): string {
    if (obs.booleanValue !== null && obs.booleanValue !== undefined)
      return obs.booleanValue ? 'Yes' : 'No';
    if (obs.numericValue !== null && obs.numericValue !== undefined)
      return String(obs.numericValue);
    if (obs.textValue) return obs.textValue;
    return '-';
  }
}
