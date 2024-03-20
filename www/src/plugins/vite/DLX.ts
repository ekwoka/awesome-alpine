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

export const URL = () => ({
  name: 'dlx',
  resolveId(id: string) {
    if (id.includes('?urlfollow')) {
      return id;
    }
  },
  async load(id: string) {
    if (id.includes('?urlfollow')) {
      id = id.replace('?urlfollow', '');
      console.log('getting current url for ', id, '...');
      const response = await fetch('https://' + id, {
        redirect: 'manual',
      });
      if ([302, 301].includes(response.status)) {
        const redirect = response.headers.get('location');
        if (redirect) {
          console.log('Using Redirected location for: ', id, ' at: ', redirect);
          return `export const url = '${redirect}'`;
        }
      }
      console.log('url not redirected. Using default:', id);
      return `export const url = 'https://${id}'`;
    }
  },
});
