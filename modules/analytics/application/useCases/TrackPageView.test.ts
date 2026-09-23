import '../../tests/testUtils';
import { TrackPageViewUseCase } from './TrackPageView';
import { emitMock } from '../../tests/testUtils';

describe('TrackPageViewUseCase', () => {
  const useCase = new TrackPageViewUseCase();

  it('should emit analytics.pageview.tracked and return a page view id when the input is valid', async () => {
    const result = await useCase.execute({
      sessionId: 's1',
      pageUrl: '/home',
      pageTitle: 'Home',
    });

    expect(result.success).toBe(true);
    expect(result.pageViewId).toBeDefined();
    expect(emitMock).toHaveBeenCalledWith(
      'analytics.pageview.tracked',
      expect.objectContaining({ sessionId: 's1', pageUrl: '/home' }),
    );
  });

  it('should fail without emitting when the session id is missing', async () => {
    const result = await useCase.execute({ sessionId: '', pageUrl: '/home' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session ID is required');
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should fail without emitting when the page url is missing', async () => {
    const result = await useCase.execute({ sessionId: 's1', pageUrl: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Page URL is required');
    expect(emitMock).not.toHaveBeenCalled();
  });
});
