import { type Schema, SchemaType } from "@google/generative-ai";

export const RECOMMENDATION_SCHEMA: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      offerId: { type: SchemaType.STRING },
      reason: { type: SchemaType.STRING },
    },
    required: ["offerId", "reason"],
  },
};

export const TIPS_SCHEMA: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      body: { type: SchemaType.STRING },
    },
    required: ["title", "body"],
  },
};
