import { HTMA } from '../src';

describe('HTMX Alpine', () => {
  it('should allow replacing the element', async () => {
    const node = await render(`<div><div
      id="hello"
      hx-get="${URL.createObjectURL(
        new Blob([
          `<!doctype html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>AlpineTS Sandbox</title>
                <script type="module">
                  import { HTMA } from '../packages/htma/src/index.ts';
                  import Alpine from 'alpinejs';

                  window.Alpine = Alpine;
                  Alpine.plugin(HTMA);
                  Alpine.start();
                </script>
              </head>
              <body>
                <div
                  id="hello"
                  hx-get="/"
                  hx-select="#hello"
                  style="background-color: green; padding: 2rem">
                  <input type="text" value="starting" @click.stop />
                </div>
              </body>
            </html>
          `,
        ]),
      )}"
      hx-select="#hello"
      style="background-color: red; padding: 2rem">
      <input type="text" value="otherthing" @click.stop />
    </div></div>`).withPlugin(HTMA);
    expect(node.querySelector('input')?.value).toBe('otherthing');
    node.querySelector<HTMLDivElement>('#hello')?.click();
    await window.happyDOM.waitUntilComplete();
    expect(node.querySelector('input')?.value).toBe('starting');
  });
});
