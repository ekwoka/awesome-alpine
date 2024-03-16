export const DLX = () => ({
  name: 'dlx',
  resolveId(id: string) {
    if (id.includes('?dlx')) {
      return id;
    }
  },
  async load(id: string) {
    if (id.includes('?dlx')) {
      console.log('downloading script from', id, '...');
      const res = await fetch('https://' + id);
      const text = await res.text();
      console.log('downloaded script from', id, '...');
      console.log('size:', text.length, 'bytes');
      if (id.includes('&json'))
        return `export default JSON.parse(${JSON.stringify(text)})`;
      return text;
    }
  },
});
