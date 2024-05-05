import { Toasts } from '../src';

/// <reference types="testing-library-alpine/globals" />

describe('Alpine Toasts', () => {
  describe('Toast Manager', () => {
    it('Should display/remove a toast', async () => {
      await render(`<div></div>`).withPlugin(Toasts);
      const $toasts = Alpine.$toasts;
      const toast = $toasts.show('Hello, world!', 'info', 0)!;
      expect(toast).toBeDefined();
      expect(toast.message).toBe('Hello, world!');
      expect(toast.shown).toBe(false);
      await Alpine.nextTick();
      expect(toast.shown).toBe(true);
      $toasts.dismiss(toast);
      expect(toast.shown).toBe(false);
      expect($toasts.queue).toContain(toast);
      $toasts.clearFromQueue(toast);
      expect($toasts.queue).not.toContain(toast);
    });
  });
});
