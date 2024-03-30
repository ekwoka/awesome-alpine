import { defineCollection, z } from 'astro:content';

const Posts = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      author: z.string(),
      image: z.optional(image()),
      description: z.string(),
      date: z.date(),
    }),
});

const Docs = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      pkg: z.string(),
      page: z.string(),
      version: z.optional(image()),
      description: z.string(),
      date: z.date(),
    }),
});

export const collections = {
  post: Posts,
  docs: Docs,
};
