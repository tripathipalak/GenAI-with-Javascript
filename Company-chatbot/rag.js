/* Implementation plan 
Stage 1: Indexing
1. Load the document - pdf, text 
2. Chunk the document
3. Generate vector embeddings 
4. Store the vector embeddings - Vector database

Stage 2: Using the chatbot 
1. Setup LLM 
2. Add retrival step 
3. Pass input + relevant information to LLM 
4. Done every step  */


import "dotenv/config";
import { indexTheDocument } from "./prepare.js";

const filePath = "./cg-internal-docs.pdf";
await indexTheDocument(filePath);