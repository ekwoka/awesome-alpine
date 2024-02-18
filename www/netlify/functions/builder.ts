import { type Handler, builder } from '@netlify/functions';

const mainBuilder: Handler = async (event, _context) => {
  const path = event.path;
  console.log(path);
  const page = await fetch(`${process.env.URL}/api/main?path=${path}`).then(
    (res) => res.text(),
  );
  return {
    statusCode: 200,
    body: page,
  };
};

const handler = builder(mainBuilder);

export { handler };
