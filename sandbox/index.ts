const PER_ADD = 10_000;

type LoopMethod = (
  templateEl: HTMLTemplateElement,
  iteratorNames: {
    items: string;
    item: string;
    index: string;
    collection: string;
  },
  evaluateItems: (cb: (items: number[]) => void) => void,
  evaluateKey: (
    cb: (key: number) => void,
    extra: { scope: { index: number; item: number } },
  ) => void,
) => void;
type Scope = Record<string, unknown>;
const reactive = <T extends Scope>(scope: T) => scope;
const addScopeToNode = (
  el: HTMLElement,
  scope: Scope,
  _template: HTMLTemplateElement,
) => {
  el._scope = scope;
};
const mutateDom = (cb: () => void) => cb();
// biome-ignore lint/suspicious/noEmptyBlockStatements: Mocked Functions
const initTree = (_el: HTMLElement) => {};
// biome-ignore lint/suspicious/noEmptyBlockStatements: Mocked Functions
const destroyTree = (_el: HTMLElement) => {};
const skipDuringClone = (cb: () => void) => cb;
const makeRefresher =
  (scope: Record<string, unknown>) => (newScope: Record<string, unknown>) => {
    Object.entries(newScope).forEach(([key, value]) => {
      scope[key] = value;
    });
  };
const methods: Record<string, LoopMethod> = {
  refactored(templateEl, iteratorNames, evaluateItems, evaluateKey) {
    evaluateItems((items) => {
      const oldLookup: Map<string | number, HTMLElement> =
        templateEl._x_lookup_map;
      const lookup = new Map<string | number, HTMLElement>();
      templateEl._x_lookup_map = lookup;
      const scopeEntries: [key: number, scope: Scope][] = [];

      items.forEach((item, index) => {
        const scope = {
          iteratorNames,
          item,
          index,
          items,
        };

        evaluateKey(
          (key) => {
            if (oldLookup.has(key)) {
              lookup.set(key, oldLookup.get(key));
              oldLookup.delete(key);
            }
            scopeEntries.push([key, scope]);
          },
          {
            scope: scope,
          },
        );
      });

      oldLookup.forEach((el) => {
        destroyTree(el);
        el.remove();
      });

      const added = new Set<HTMLElement>();

      // This is the important part of the diffing algo. Identifying
      // which keys (future DOM elements) are new, which ones have
      // or haven't moved (noting where they moved to / from).
      let prev: HTMLElement = templateEl;

      scopeEntries.forEach(([key, scope]) => {
        if (lookup.has(key)) {
          const el = lookup.get(key)!;
          if (prev.nextElementSibling !== el) {
            if (prev.nextElementSibling)
              el.replaceWith(prev.nextElementSibling);
            prev.after(el);
          }
          prev = el;
          if (el._x_currentIfEl) {
            if (el.nextElementSibling !== el._x_currentIfEl)
              prev.after(el._x_currentIfEl);
            prev = el._x_currentIfEl;
          }
          return;
        }

        const clone = templateEl.content.firstElementChild!.cloneNode(
          true,
        ) as HTMLElement;
        const reactiveScope = reactive(scope);
        addScopeToNode(clone, reactiveScope, templateEl);
        clone._x_refreshXForScope = makeRefresher(reactiveScope);

        lookup.set(key, clone);
        added.add(clone);
        clone.textContent = key.toString();
        prev.after(clone);
        prev = clone;
      });

      skipDuringClone(() => added.forEach((clone) => initTree(clone)))();
    });
  },
  unrolledloops(templateEl, iteratorNames, evaluateItems, evaluateKey) {
    evaluateItems((items) => {
      const oldLookup: Map<string | number, HTMLElement> =
        templateEl._x_lookup_map;
      const lookup = new Map<string | number, HTMLElement>();
      templateEl._x_lookup_map = lookup;
      const scopeEntries: [key: number, scope: Scope][] = [];

      for (let i = 0; i < items.length; i++) {
        const scope = {
          iteratorNames,
          item: items[i],
          index: i,
          items,
        };

        evaluateKey(
          (key) => {
            if (oldLookup.has(key)) {
              lookup.set(key, oldLookup.get(key));
              oldLookup.delete(key);
            }
            scopeEntries.push([key, scope]);
          },
          {
            scope: scope,
          },
        );
      }

      oldLookup.forEach((el) => {
        destroyTree(el);
        el.remove();
      });

      const added = new Set<HTMLElement>();

      // This is the important part of the diffing algo. Identifying
      // which keys (future DOM elements) are new, which ones have
      // or haven't moved (noting where they moved to / from).
      let prev: HTMLElement = templateEl;

      for (let i = 0; i < scopeEntries.length; i++) {
        const [key, scope] = scopeEntries[i];
        if (lookup.has(key)) {
          const el = lookup.get(key)!;
          el._x_refreshXForScope(scope);
          if (prev.nextElementSibling !== el) {
            if (prev.nextElementSibling)
              el.replaceWith(prev.nextElementSibling);
            prev.after(el);
          }
          prev = el;
          if (el._x_currentIfEl) {
            if (el.nextElementSibling !== el._x_currentIfEl)
              prev.after(el._x_currentIfEl);
            prev = el._x_currentIfEl;
          }
          continue;
        }

        const clone = templateEl.content.firstElementChild!.cloneNode(
          true,
        ) as HTMLElement;
        const reactiveScope = reactive(scope);
        addScopeToNode(clone, reactiveScope, templateEl);
        clone._x_refreshXForScope = makeRefresher(reactiveScope);

        lookup.set(key, clone);
        added.add(clone);
        clone.textContent = key.toString();
        prev.after(clone);
        prev = clone;
      }

      skipDuringClone(() => added.forEach((clone) => initTree(clone)))();
    });
  },
  old(el, iteratorNames, evaluateItems, evaluateKey) {
    const templateEl = el;

    evaluateItems((items) => {
      // Prepare yourself. There's a lot going on here. Take heart,
      // every bit of complexity in this function was added for
      // the purpose of making Alpine fast with large datas.

      if (items === undefined) items = [];

      const lookup = el._x_lookup;
      let prevKeys = el._x_prevKeys;
      const scopes = [];
      const keys = [];

      for (let i = 0; i < items.length; i++) {
        const scope = {
          iteratorNames,
          item: items[i],
          index: i,
          items,
        };

        evaluateKey(
          (value) => {
            if (keys.includes(value)) warn('Duplicate key on x-for', el);

            keys.push(value);
          },
          { scope: { index: i, ...scope } },
        );

        scopes.push(scope);
      }

      // Rather than making DOM manipulations inside one large loop, we'll
      // instead track which mutations need to be made in the following
      // arrays. After we're finished, we can batch them at the end.
      const adds = [];
      const moves = [];
      const removes = [];
      const sames = [];

      // First, we track elements that will need to be removed.
      for (let i = 0; i < prevKeys.length; i++) {
        const key = prevKeys[i];

        if (keys.indexOf(key) === -1) removes.push(key);
      }

      // Notice we're mutating prevKeys as we go. This makes it
      // so that we can efficiently make incremental comparisons.
      prevKeys = prevKeys.filter((key) => !removes.includes(key));

      let lastKey = 'template';

      // This is the important part of the diffing algo. Identifying
      // which keys (future DOM elements) are new, which ones have
      // or haven't moved (noting where they moved to / from).
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        const prevIndex = prevKeys.indexOf(key);

        if (prevIndex === -1) {
          // New key found.
          prevKeys.splice(i, 0, key);

          adds.push([lastKey, i]);
        } else if (prevIndex !== i) {
          // A key has moved.
          const keyInSpot = prevKeys.splice(i, 1)[0];
          const keyForSpot = prevKeys.splice(prevIndex - 1, 1)[0];

          prevKeys.splice(i, 0, keyForSpot);
          prevKeys.splice(prevIndex, 0, keyInSpot);

          moves.push([keyInSpot, keyForSpot]);
        } else {
          // This key hasn't moved, but we'll still keep track
          // so that we can refresh it later on.
          sames.push(key);
        }

        lastKey = key;
      }

      // Now that we've done the diffing work, we can apply the mutations
      // in batches for both separating types work and optimizing
      // for browser performance.

      // We'll remove all the nodes that need to be removed,
      // and clean up any side effects they had.
      for (let i = 0; i < removes.length; i++) {
        const key = removes[i];

        if (!(key in lookup)) continue;

        mutateDom(() => {
          destroyTree(lookup[key]);

          lookup[key].remove();
        });

        delete lookup[key];
      }

      // Here we'll move elements around, skipping
      // mutation observer triggers by using "mutateDom".
      for (let i = 0; i < moves.length; i++) {
        const [keyInSpot, keyForSpot] = moves[i];

        const elInSpot = lookup[keyInSpot];
        const elForSpot = lookup[keyForSpot];

        const marker = document.createElement('div');

        mutateDom(() => {
          elForSpot.after(marker);
          elInSpot.after(elForSpot);
          elForSpot._x_currentIfEl && elForSpot.after(elForSpot._x_currentIfEl);
          marker.before(elInSpot);
          elInSpot._x_currentIfEl && elInSpot.after(elInSpot._x_currentIfEl);
          marker.remove();
        });
        elForSpot.textContent = keyForSpot;
        elForSpot._x_refreshXForScope(scopes[keys.indexOf(keyForSpot)]);
      }

      // We can now create and add new elements.
      for (let i = 0; i < adds.length; i++) {
        const [lastKey, index] = adds[i];

        let lastEl = lastKey === 'template' ? templateEl : lookup[lastKey];
        // If the element is a x-if template evaluated to true,
        // point lastEl to the if-generated node
        if (lastEl._x_currentIfEl) lastEl = lastEl._x_currentIfEl;

        const scope = scopes[index];
        const key = keys[index];

        const clone = document.importNode(
          templateEl.content,
          true,
        ).firstElementChild;

        const reactiveScope = reactive(scope);

        addScopeToNode(clone, reactiveScope, templateEl);

        clone._x_refreshXForScope = (newScope) => {
          Object.entries(newScope).forEach(([key, value]) => {
            reactiveScope[key] = value;
          });
        };

        mutateDom(() => {
          lastEl.after(clone);
          clone.textContent = key;
          // These nodes will be "inited" as morph walks the tree...
          skipDuringClone(() => initTree(clone))();
        });

        lookup[key] = clone;
      }

      // If an element hasn't changed, we still want to "refresh" the
      // data it depends on in case the data has changed in an
      // "unobservable" way.
      for (let i = 0; i < sames.length; i++) {
        lookup[sames[i]]._x_refreshXForScope(scopes[keys.indexOf(sames[i])]);
      }

      // Now we'll log the keys (and the order they're in) for comparing
      // against next time.
      templateEl._x_prevKeys = keys;
    });
  },
  create(templateEl, _iteratorNames, evaluateItems, _evaluateKey) {
    evaluateItems((items) => {
      let prev = templateEl;
      items.forEach((item) => {
        const clone = templateEl.content.firstElementChild!.cloneNode(
          true,
        ) as HTMLElement;
        clone.textContent = item.toString();
        prev.after(clone);
        prev = clone;
      });
    });
  },
  remove(templateEl, _iteratorNames, evaluateItems, _evaluateKey) {
    evaluateItems((items) => {
      let prev = templateEl;
      const elements = items.map((item) => {
        const node = templateEl.content.firstElementChild!.cloneNode(
          true,
        ) as HTMLElement;
        node.textContent = item.toString();
        prev.after(node);
        prev = node;
        return node;
      });

      templateEl.oldElements.forEach((el) => el.remove());

      templateEl.oldElements = elements;
    });
  },
  move(templateEl, _iteratorNames, evaluateItems, _evaluateKey) {
    evaluateItems((items) => {
      let prev = templateEl;
      const elements = items.map((key) => {
        if (templateEl.elements.has(key)) {
          const node = templateEl.elements.get(key);
          prev.after(node);
          prev = node;
          return node;
        }
        const node = templateEl.content.firstElementChild!.cloneNode(true);
        node.textContent = key.toString();
        templateEl.elements.set(key, node);
        prev.after(node);
        prev = node;
        return node;
      });

      templateEl.elements
        .entries()
        .filter(([_, el]) => !elements.includes(el))
        .forEach(([key, el]) => {
          el.remove();
          templateEl.elements.delete(key);
        });
    });
  },
  skipruns(templateEl, _iteratorNames, evaluateItems, _evaluateKey) {
    evaluateItems((items) => {
      let prev = templateEl;
      const elements = items.map((key) => {
        if (templateEl.elements.has(key)) {
          const node = templateEl.elements.get(key);

          if (prev.nextElementSibling !== node) prev.after(node);
          prev = node;
          return node;
        }
        const node = templateEl.content.firstElementChild!.cloneNode(true);
        node.textContent = key.toString();
        templateEl.elements.set(key, node);
        prev.after(node);
        prev = node;
        return node;
      });

      templateEl.elements
        .entries()
        .filter(([_, el]) => !elements.includes(el))
        .forEach(([key, el]) => {
          el.remove();
          templateEl.elements.delete(key);
        });
    });
  },
  shiftlookup(templateEl, _iteratorNames, evaluateItems, _evaluateKey) {
    evaluateItems((items) => {
      const oldLookup: Map<number, HTMLElement> = templateEl.elements;
      templateEl.elements = new Map<number, HTMLElement>();
      items.forEach((key) => {
        if (oldLookup.has(key)) {
          templateEl.elements.set(key, oldLookup.get(key));
          oldLookup.delete(key);
        }
      });

      oldLookup.forEach((el) => {
        el.remove();
      });

      let prev = templateEl;
      items.map((key) => {
        if (templateEl.elements.has(key)) {
          const node = templateEl.elements.get(key);

          if (prev.nextElementSibling !== node) prev.after(node);
          prev = node;
          return node;
        }
        const node = templateEl.content.firstElementChild!.cloneNode(true);
        node.textContent = key.toString();
        templateEl.elements.set(key, node);
        prev.after(node);
        prev = node;
        return node;
      });
    });
  },
};

const methodTemplate = document.querySelector('template')!;

[`old`, `refactored`, `move`, 'shiftlookup'].forEach((method) => {
  let count = 0;
  let items: number[] = [];

  const fragment = methodTemplate.content.cloneNode(true) as DocumentFragment;
  fragment.querySelector('h2')!.textContent = method;
  const rowTemplate = fragment.querySelector('template')!;
  rowTemplate._x_lookup = {};
  rowTemplate._x_lookup_map = new Map<string | number, HTMLElement>();
  rowTemplate._x_prevKeys = [];
  rowTemplate.oldElements = [];
  rowTemplate.elements = new Map<string | number, HTMLElement>();
  const render = (name: string) => {
    const start = performance.now();
    methods[method](
      rowTemplate,
      {
        items: 'items',
        item: 'item',
        index: 'index',
        collection: 'collection',
      },
      (cb) => cb(items),
      (cb, extra) => cb(extra.scope.item),
    );
    const ownEnd = performance.now();
    queueMicrotask(() =>
      setTimeout(() => {
        const paintEnd = performance.now();
        console.log(
          `| ${name} | ${(ownEnd - start).toFixed(3)} | ${(paintEnd - ownEnd).toFixed(3)} | **${(paintEnd - start).toFixed(3)}** |`,
        );
      }, 0),
    );
  };
  fragment.querySelector('button[data-add]')?.addEventListener('click', () => {
    /* console.log('\nMETHOD:', method); */
    // console.log(items.length, ' -> ', items.length + PER_ADD);
    for (let i = 0; i < PER_ADD; i++) items.push(count++);
    render(`Add ${PER_ADD.toLocaleString('en-us')} Items`);
  });
  fragment
    .querySelector('button[data-add-one]')
    ?.addEventListener('click', () => {
      /* console.log('\nMETHOD:', method); */
      // console.log(items.length, ' -> ', items.length + 1);
      for (let i = 0; i < 1; i++) items.push(count++);
      render(`Add Additional 1 Item`);
    });
  fragment
    .querySelector('button[data-remove]')
    ?.addEventListener('click', () => {
      /* console.log('\nMETHOD:', method); */
      const count = items.length;
      items = [];
      render(`Remove Remaining ${count.toLocaleString('en-us')} Items`);
    });
  fragment
    .querySelector('button[data-remove-one]')
    ?.addEventListener('click', () => {
      /* console.log('\nMETHOD:', method); */
      items.pop();
      render(`Remove 1 Item`);
    });
  fragment.querySelector('button[data-swap]')?.addEventListener('click', () => {
    /* console.log('\nMETHOD:', method); */
    const first = ((Math.random() * items.length) / 4) | 0;
    const second =
      (((Math.random() * items.length) / 4) | 0) +
      (((items.length / 4) * 3) | 0);
    [items[first], items[second]] = [items[second], items[first]];
    render(`Swapping 2 Items`);
  });
  fragment.querySelector('button[data-sort]')?.addEventListener('click', () => {
    /* console.log('\nMETHOD:', method); */
    const count = items.length;
    items.sort((a, b) => a - b);
    render(`Sort ${count.toLocaleString('en-us')} Items`);
  });
  fragment
    .querySelector('button[data-reverse]')
    ?.addEventListener('click', () => {
      /* console.log('\nMETHOD:', method); */
      const count = items.length;
      items.reverse();
      render(`Reverse ${count.toLocaleString('en-us')} Items`);
    });
  fragment
    .querySelector('button[data-shuffle]')
    ?.addEventListener('click', () => {
      /* console.log('\nMETHOD:', method); */
      const count = items.length;
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      render(`Shuffle ${count.toLocaleString('en-us')} Items`);
    });
  fragment
    .querySelector('button[data-remove-second]')
    ?.addEventListener('click', () => {
      /* console.log('\nMETHOD:', method); */
      items = items.filter((_, i) => i % 2 === 0);
      render(`Remove Every Other Item`);
    });
  document.body.append(fragment);
});
