import persist from '@alpinejs/persist';
import query, { base64URL } from '@ekwoka/alpine-history';
import Alpine, { type PluginCallback } from 'alpinejs';
import type { editor } from 'monaco-editor';
import { CorePlugin } from '../../lib/lazyModules/alpinePlugins';
import { RPCReceiver, RPCSender } from '../../lib/postmessageRPC';
import { prettify } from '../../lib/prettier';
import { Language } from '../../lib/prettier';
import type { sandboxActions } from '../../play/playSandbox';
import starterHTML from '../../play/starter.html?raw';
import starterScript from '../../play/starter.js?raw';
import { bitwiseArray, booleanNumber } from '../../plugins/encoding';
import versionData from './alpine-versions';

const makeEditor = () =>
  import('../../lib/makeEditor.js').then((m) => m.makeEditor);

const transpile = () =>
  import('../../lib/transpile.js').then((m) => m.transpile);

export const Editor: PluginCallback = (Alpine) => {
  Alpine.plugin([persist, query]);

  Alpine.data('editor', () => {
    let abortController: AbortController | null = null;
    return {
      panel: Alpine.query('markup'),
      config: {
        plugins: Alpine.query<CorePlugin[]>([])
          .as('coreplugins')
          .encoding(bitwiseArray),
        settings: {
          typescript: Alpine.query(false).as('ts').encoding(booleanNumber),
          tailwind: Alpine.query(false).as('tw').encoding(booleanNumber),
          version: Alpine.query<`${number}.${number}.${number}`>(
            versionData.alpinejs[0],
          ).as('v'),
        },
      },
      versionData,
      value: {
        html: Alpine.query(starterHTML).encoding(base64URL).as('html'),
        typescript: Alpine.query(starterScript)
          .encoding(base64URL)
          .as('script'),
      },
      editor: {
        [Language.HTML]: null as editor.IStandaloneCodeEditor | null,
        [Language.TYPESCRIPT]: null as editor.IStandaloneCodeEditor | null,
      } satisfies Record<
        Language.HTML | Language.TYPESCRIPT,
        editor.IStandaloneCodeEditor | null
      >,
      sandbox: null as RPCSender<sandboxActions> | null,
      async registerEditor(
        el: HTMLElement,
        type: Language.HTML | Language.TYPESCRIPT,
      ) {
        this.editor[type] = (await makeEditor())(el, this.value[type], type);
      },
      init() {
        new RPCReceiver({
          registerSandbox: (event?: MessageEvent<undefined>) => {
            if (event?.source) {
              console.log('registering sandbox to editor');
              this.initializeSandbox(
                new RPCSender<sandboxActions>(event.source as Window),
              );
              return true;
            }
            return null;
          },
        });
        Alpine.effect(() => {
          this.config.plugins = this.config.plugins.filter(
            this.versionExists.bind(this),
          );
        });
      },
      versionExists(plugin: CorePlugin) {
        return versionData[
          `@alpinejs/${CorePlugin[plugin].toLowerCase()}`
        ].includes(this.config.settings.version);
      },
      async initializeSandbox(sandbox: RPCSender<sandboxActions>) {
        this.sandbox = sandbox;
        console.log('initializing sandbox');
        await Promise.all([
          effectPromise(async () => {
            console.log('checking tailwind');
            if (this.config.settings.tailwind)
              await this.sandbox?.call.loadTailwind();
          }),
          effectPromise(async () => {
            console.log('bundling code');
            if (abortController) abortController.abort();
            abortController = null;
            if (!(JSON.stringify(this.config) && this.value.typescript)) return;
            abortController = new AbortController();
            const signal = abortController.signal;
            const esm = await (await transpile())(
              this.value.typescript,
              this.config,
            );
            if (signal.aborted) return;
            abortController = null;
            console.log('loading script');
            await this.sandbox?.call.loadScript(esm);
          }),
        ]);
        await effectPromise(async () => {
          console.log('replacing markup');
          await this.sandbox?.call.replaceMarkup(this.value.html);
        });
        console.log('starting sandbox');
        this.sandbox.call.start();
      },
      async prettify() {
        for (const type of [Language.HTML, Language.TYPESCRIPT] as const) {
          this.value[type] = await prettify(this.value[type], type as Language);
          await Alpine.raw(this.editor[type])?.setValue(this.value[type]);
        }
      },
      async update(type: Language.HTML | Language.TYPESCRIPT) {
        const content = Alpine.raw(this.editor[type])?.getValue();
        if (content === undefined) return;
        this.value[type] = await prettify(content, type);
      },
      CorePlugins: Object.entries(CorePlugin).filter(([key]) =>
        isNaN(+key),
      ) as [string, CorePlugin][],
    };
  });
  Alpine.data('shareButton', () => ({
    status: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    async getShareURL() {
      const params = window.location.search;
      try {
        const res = await fetch(`/play/share${params}`);
        if (res.ok) {
          const shareKey = await res.text();
          return `${window.location.origin}/play?share=${shareKey}`;
        }
      } catch (e) {
        console.error(e);
      }
      return window.location.href;
    },
    async share() {
      this.status = 'loading';
      const url = await this.getShareURL();
      if (url) {
        navigator.clipboard.writeText(url);
        this.status = 'success';
      } else {
        this.status = 'error';
      }
    },
  }));
};

const effectPromise = (fn: () => Promise<void>) =>
  new Promise<void>((res) => {
    Alpine.effect(async () => {
      await fn();
      res();
    });
  });
