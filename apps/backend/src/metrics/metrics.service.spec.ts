import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate weighted average of metrics rounded to two decimals', () => {
    const metrics = {
      strength: 3,
      cappedBrood: 2,
      uncappedBrood: 1,
      honeyStores: 4,
      pollenStores: 5,
      queenCells: 3,
      swarmCells: false,
      supersedureCells: false,
      queenSeen: true,
    };
    const { overallScore } = service.calculateOveralScore(metrics);
    expect(overallScore).toEqual(3.6);
  });

  it('should handle missing data', () => {
    const metrics = {
      strength: 3,
      cappedBrood: null,
      uncappedBrood: null,
      honeyStores: null,
      pollenStores: null,
      queenCells: null,
      swarmCells: null,
      supersedureCells: null,
      queenSeen: null,
    };
    const { overallScore, populationScore } =
      service.calculateOveralScore(metrics);
    expect(overallScore).toEqual(5.33);
    expect(populationScore).toEqual(3);
  });

  test.each([
    [3, null, null, 3],
    [10, 1, 1, 5.5],
    [1, 10, 1, 3.25],
    [10, 10, 10, 10],
    [null, null, null, null],
  ])(
    'should calculate population score, strength: %d, cappedBrood: %d, uncappedBrood: %d, expected: %d',
    (strength, cappedBrood, uncappedBrood, expected) => {
      const metrics = {
        strength,
        cappedBrood,
        uncappedBrood,
        honeyStores: null,
        pollenStores: null,
        queenCells: null,
        swarmCells: null,
        supersedureCells: null,
        queenSeen: null,
      };
      const { populationScore } = service.calculateOveralScore(metrics);
      expect(populationScore).toEqual(expected);
    },
  );
});
