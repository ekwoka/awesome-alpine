import { defineCollection, z } from 'astro:content';

const Posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: z.string(),
    description: z.string(),
    date: z.date(),
  }),
});

export const collections = {
  post: Posts,
};
