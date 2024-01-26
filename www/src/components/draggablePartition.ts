import Alpine from 'alpinejs';

/* This is 💩, but it's my 💩 */
Alpine.directive('partition', (el) => {
  console.log('partition directive');
  const $partition = Alpine.reactive({
    position: 40,
    dragging: false,
    mousedown() {
      console.log('starting drag');
      this.dragging = true;
    },
    mouseup(e: PointerEvent) {
      if (this.dragging) e.preventDefault();
      console.log('ending drag');
      this.dragging = false;
    },
    drag(e: PointerEvent) {
      if (!this.dragging) return;
      const { left, width } = el.getBoundingClientRect();
      this.position = ((((e.clientX - left) / width) * 10000) | 0) / 100;
    },
    scalable: {
      ':style': '{ width: `${$partition.position}%`}',
    },
    handle: {
      '@mousedown.prevent': '$partition.mousedown($event)',
      ':class':
        "{ 'cursor-grab': !$partition.dragging, 'w-3 bg-neutral-600': $partition.dragging }",
    },
  });

  Alpine.addScopeToNode(el, { $partition });
  Alpine.bind(el, {
    '@mousemove.prevent': '$partition.drag($event)',
    '@mouseup.window': '$partition.mouseup($event)',
    ':class': "{ '!cursor-grabbing': $partition.dragging }",
  });

  console.log(Alpine.raw(Alpine.$data(el)));
}).before('bind');
