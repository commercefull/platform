jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { TrackPageViewUseCase} from './TrackPageView';
import { eventBus } from '../../../../libs/events/eventBus';

describe('TrackPageViewUseCase', () => {
  let useCase: TrackPageViewUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new TrackPageViewUseCase();
  });

  it('should track page view (happy path)', async () => {
    const result = await useCase.execute({
      sessionId: 's1', pageUrl: '/home', pageTitle: 'Home',
    });

    expect(result.success).toBe(true);
    expect(result.pageViewId).toBeDefined();
    expect(eventBus.emit).toHaveBeenCalledWith('analytics.pageview.tracked', expect.objectContaining({ sessionId: 's1' }));
  });

  it('should return error when sessionId is missing', async () => {
    const result = await useCase.execute({ sessionId: '', pageUrl: '/home' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session ID is required');
  });

  it('should return error when pageUrl is missing', async () => {
    const result = await useCase.execute({ sessionId: 's1', pageUrl: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Page URL is required');
  });
});
