import type { Alpine } from 'alpinejs';

export const Draggable = (Alpine: Alpine) => {
  /* This is 💩, but it's my 💩 */
  Alpine.directive('partition', (el) => {
    const $partition = Alpine.reactive({
      horizontal: 40,
      vertical: 40,
      dragging: false,
      mousedown() {
        this.dragging = true;
      },
      mouseup(e: PointerEvent) {
        if (!this.dragging) return;
        e.preventDefault();
        this.dragging = false;
      },
      drag(e: PointerEvent) {
        if (!this.dragging) return;
        const { left, top, width, height } = el.getBoundingClientRect();
        this.horizontal = ((((e.clientX - left) / width) * 10000) | 0) / 100;
        this.vertical = ((((e.clientY - top) / height) * 10000) | 0) / 100;
      },
      scalable() {
        return {
          ':style':
            '{ width: `${$partition.horizontal}%`, height: `${$partition.vertical}%` }',
        };
      },
      handle: {
        '@mousedown.prevent': '$partition.mousedown($event)',
        ':class':
          "{ 'cursor-grab': !$partition.dragging, 'w-3 h-3 bg-neutral-600': $partition.dragging }",
      },
    });

    Alpine.addScopeToNode(el, { $partition });
    Alpine.bind(el, {
      '@mousemove.prevent': '$partition.drag($event)',
      '@mouseup.window': '$partition.mouseup($event)',
      ':class': "{ '!cursor-grabbing': $partition.dragging }",
    });
  }).before('bind');
};
