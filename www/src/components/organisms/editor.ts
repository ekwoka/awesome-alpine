import { CorePlugin } from '../../lib/lazyModules/alpinePlugins';
import { RPCReceiver, RPCSender } from '../../lib/postmessageRPC';
import { prettify } from '../../lib/prettier';
import { Language } from '../../lib/prettier';
import type { sandboxActions } from '../../play/playSandbox';
// @ts-expect-error - this is a raw template inmport
import starterHTML from '../../play/starter.html?raw';
// @ts-expect-error - this is a raw template import
import starterScript from '../../play/starter.js?raw';
import { bitwiseArray, booleanNumber } from '../../plugins/encoding';
import persist from '@alpinejs/persist';
import query, { base64URL } from '@ekwoka/alpine-history';
import versionData from 'alpine-versions';
import Alpine, { PluginCallback } from 'alpinejs';
import type { editor } from 'monaco-editor';

const makeEditor = () =>
  import('../../lib/makeEditor.js').then((m) => m.makeEditor);

const transpile = () =>
  import('../../lib/transpile.js').then((m) => m.transpile);

export const Editor: PluginCallback = (Alpine) => {
  Alpine.plugin([persist, query]);

  Alpine.data('editor', () => {
    let abortController: AbortController = null;
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
        html: null as editor.IStandaloneCodeEditor,
        typescript: null as editor.IStandaloneCodeEditor,
      },
      sandbox: null as RPCSender<sandboxActions> | null,
      async registerEditor(el: HTMLElement, type: Language) {
        this.editor[type] = (await makeEditor())(el, this.value[type], type);
      },
      init() {
        new RPCReceiver({
          registerSandbox: (event?: MessageEvent<undefined>) => {
            if (event?.source)
              this.initializeSandbox(
                new RPCSender<sandboxActions>(event.source as Window),
              );
            return true;
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
        await Promise.all([
          effectPromise(async () => {
            if (this.config.settings.tailwind)
              await this.sandbox.call.loadTailwind();
          }),
          effectPromise(async () => {
            if (abortController) abortController.abort();
            abortController = null;
            if (!(JSON.stringify(this.config) && this.value.typescript)) return;
            abortController = new AbortController();
            const signal = abortController.signal;
            const esm = await (
              await transpile()
            )(this.value.typescript, this.config);
            if (signal.aborted) return;
            abortController = null;
            await this.sandbox.call.loadScript(esm);
          }),
        ]);
        await effectPromise(async () => {
          await this.sandbox.call.replaceMarkup(this.value.html);
        }),
          this.sandbox.call.start();
      },
      async prettify() {
        for (const type of [Language.HTML, Language.TYPESCRIPT]) {
          this.value[type] = await prettify(this.value[type], type as Language);
          Alpine.raw(await this.editor[type])?.setValue(this.value[type]);
        }
      },
      async update(type: Language.HTML | Language.TYPESCRIPT) {
        const content = Alpine.raw<(typeof this.editor)[typeof type]>(
          this.editor[type],
        )?.getValue();
        this.value[type] = await prettify(content, type);
      },
      CorePlugins: Object.entries(CorePlugin).filter(([key]) =>
        isNaN(+key),
      ) as [string, CorePlugin][],
    };
  });
};

const effectPromise = (fn: () => Promise<void>) =>
  new Promise<void>((res) => {
    Alpine.effect(async () => {
      await fn();
      res();
    });
  });
