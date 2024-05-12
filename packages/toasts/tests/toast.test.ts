import { Toasts } from '../src';

describe('Alpine Toasts', () => {
  describe('Toast Manager', () => {
    it('Should display/remove a toast', async () => {
      await render(`<div></div>`).withPlugin(Toasts);
      const $toasts = Alpine.$toasts;
      const toast = $toasts.show('Hello, world!')!;
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
    it('should provide details', async () => {
      await render(`<div></div>`).withPlugin(Toasts);
      const $toasts = Alpine.$toasts;
      const toast = $toasts.show('Hello, world!', { timeout: 1000 })!;
      expect(toast.details).toEqual({ timeout: 1000 });
    });
    it('should allow default details', async () => {
      await render(`<div></div>`).withPlugin(Toasts({ type: 'info' }));
      const $toasts = Alpine.$toasts;
      const toast = $toasts.show('Hello, world!')!;
      expect(toast.details).toEqual({ type: 'info' });
    });
    it('merges default details with provided details', async () => {
      await render(`<div></div>`).withPlugin(
        Toasts({ type: 'info', timeout: 500 }),
      );
      const $toasts = Alpine.$toasts;
      const toast = $toasts.show('Hello, world!', { timeout: 1000 })!;
      expect(toast.details).toEqual({ timeout: 1000, type: 'info' });
    });
  });

  describe('Toasts Reactivity', () => {
    it('should show a toast', async () => {
      const node = await render(
        `
        <div x-data>
          <template x-for="toast in $toasts.queue" :key="toast.id">
            <div x-text="toast.message"></div>
          </template>
        </div>
      `.trim(),
      ).withPlugin(Toasts);
      expect(node.children).toHaveLength(1);
      const $toasts = Alpine.$toasts;
      const toast = $toasts.show('Hello, world!')!;
      await Alpine.nextTick();
      expect(node.children).toHaveLength(2);
      expect(node.children[1]).toHaveTextContent('Hello, world!');
      $toasts.dismiss(toast);
      $toasts.clearFromQueue(toast);
      await Alpine.nextTick();
      expect(node.children).toHaveLength(1);
    });
  });
});
