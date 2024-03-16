export const ESMBuildScript = async () => {
  console.log('Getting current ESM build script...');
  const esmBuildScript = 'https://esm.sh/build';
  const response = await fetch(esmBuildScript, {
    redirect: 'manual',
  });
  if ([302, 301].includes(response.status)) {
    const redirect = response.headers.get('location');
    if (redirect) {
      console.log('Using Redirected location: ', redirect);
      return redirect;
    }
  }
  console.log('Script not redirected. Using default:', esmBuildScript);
  return esmBuildScript;
};
