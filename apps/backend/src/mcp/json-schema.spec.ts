import { simplifyJsonSchema } from './json-schema';

describe('simplifyJsonSchema', () => {
  it('turns optional nullable fields into a nullable type', () => {
    expect(
      simplifyJsonSchema({
        anyOf: [
          { anyOf: [{ not: {} }, { type: 'string', format: 'uuid' }] },
          { type: 'null' },
        ],
      }),
    ).toEqual({ type: ['string', 'null'], format: 'uuid' });
  });

  it('admits null in a nullable enum', () => {
    expect(
      simplifyJsonSchema({
        anyOf: [
          { type: 'string', enum: ['VIRGIN', 'ACTIVE'] },
          { type: 'null' },
        ],
      }),
    ).toEqual({ type: ['string', 'null'], enum: ['VIRGIN', 'ACTIVE', null] });
  });

  it('collapses duplicate branches', () => {
    expect(
      simplifyJsonSchema({
        description: 'When',
        anyOf: [
          {
            anyOf: [
              { type: 'string', format: 'date-time' },
              { type: 'string', format: 'date-time' },
            ],
          },
          { type: 'null' },
        ],
      }),
    ).toEqual({
      description: 'When',
      type: ['string', 'null'],
      format: 'date-time',
    });
  });

  it('keeps real unions and recurses into properties and items', () => {
    const union = {
      anyOf: [
        { type: 'object', properties: { a: { type: 'string' } } },
        { type: 'object', properties: { b: { type: 'number' } } },
      ],
    };
    expect(
      simplifyJsonSchema({
        type: 'object',
        properties: {
          details: union,
          tags: {
            type: 'array',
            items: { anyOf: [{ not: {} }, { type: 'string' }] },
          },
        },
      }),
    ).toEqual({
      type: 'object',
      properties: {
        details: union,
        tags: { type: 'array', items: { type: 'string' } },
      },
    });
  });
});
