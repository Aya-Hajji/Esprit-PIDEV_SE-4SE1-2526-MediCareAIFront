import { RecommendationService } from './recommendation.service';
import { Mood, Sleep } from '../../../shared/models/health-tracking.model';

describe('RecommendationService', () => {
  let service: RecommendationService;

  beforeEach(() => {
    service = new RecommendationService();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create warning recommendations after 3 consecutive bad days', () => {
    const moods: Mood[] = [
      { id: 1, userId: 1, level: 3, date: '2026-05-01' },
      { id: 2, userId: 1, level: 4, date: '2026-05-02' },
      { id: 3, userId: 1, level: 2, date: '2026-05-03' }
    ];

    const sleeps: Sleep[] = [
      { id: 1, userId: 1, hours: 5.5, quality: 4, date: '2026-05-01' },
      { id: 2, userId: 1, hours: 5.8, quality: 4, date: '2026-05-02' },
      { id: 3, userId: 1, hours: 5.2, quality: 3, date: '2026-05-03' }
    ];

    const result = service.analyzeMoodSleep(moods, sleeps);

    expect(result.badStreak).toBe(3);
    expect(result.notifications.some((notification) => notification.tone === 'warning')).toBeTrue();
    expect(JSON.parse(localStorage.getItem('activitiesRecommendations') ?? '[]').length).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem('wellnessTips') ?? '[]').length).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem('doctorsRecommendations') ?? '[]').length).toBe(0);
  });

  it('should create doctor recommendations after more than 5 consecutive bad days', () => {
    const moods: Mood[] = [
      { id: 1, userId: 1, level: 3, date: '2026-05-01' },
      { id: 2, userId: 1, level: 4, date: '2026-05-02' },
      { id: 3, userId: 1, level: 2, date: '2026-05-03' },
      { id: 4, userId: 1, level: 3, date: '2026-05-04' },
      { id: 5, userId: 1, level: 4, date: '2026-05-05' },
      { id: 6, userId: 1, level: 1, date: '2026-05-06' }
    ];

    const sleeps: Sleep[] = [
      { id: 1, userId: 1, hours: 5.5, quality: 4, date: '2026-05-01' },
      { id: 2, userId: 1, hours: 5.8, quality: 4, date: '2026-05-02' },
      { id: 3, userId: 1, hours: 5.2, quality: 3, date: '2026-05-03' },
      { id: 4, userId: 1, hours: 5.1, quality: 3, date: '2026-05-04' },
      { id: 5, userId: 1, hours: 5.9, quality: 4, date: '2026-05-05' },
      { id: 6, userId: 1, hours: 5.4, quality: 4, date: '2026-05-06' }
    ];

    const result = service.analyzeMoodSleep(moods, sleeps);

    expect(result.badStreak).toBe(6);
    expect(result.notifications.some((notification) => notification.tone === 'doctor')).toBeTrue();
    expect(JSON.parse(localStorage.getItem('doctorsRecommendations') ?? '[]').length).toBeGreaterThan(0);
  });
});