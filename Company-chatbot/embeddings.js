import { pipeline } from "@xenova/transformers";

let extractor;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

export const embeddings = {
  async embedDocuments(texts) {
    const ext = await getExtractor();
    const results = [];
    for (const text of texts) {
      const output = await ext(text, { pooling: "mean", normalize: true });
      results.push(Array.from(output.data));
    }
    return results;
  },
  async embedQuery(text) {
    const ext = await getExtractor();
    const output = await ext(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  },
};