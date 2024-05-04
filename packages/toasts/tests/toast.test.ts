import { toast } from '../src';

describe('HTMX Alpine', () => {
  it('should allow replacing the element', async () => {
    const node = await render(`<div></div>`).withPlugin(toast);
    expect(node).toBeDefined();
  });
});
