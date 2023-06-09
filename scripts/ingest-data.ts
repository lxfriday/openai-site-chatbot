import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Chroma } from 'langchain/vectorstores/chroma';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { COLLECTION_NAME } from '@/config/chroma';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';

export const run = async () => {
  try {
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(
      'docs',
      {
        '.pdf': (path) => new CustomPDFLoader(path),
        '.txt': (path) => new TextLoader(path),
      },
      true,
    );

    // const loader = new PDFLoader(filePath);
    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();

    let chroma = new Chroma(embeddings, { collectionName: COLLECTION_NAME });
    await chroma.index?.reset();

    //embed the PDF documents

    // Ingest documents in batches of 100

    for (let i = 0; i < docs.length; i += 100) {
      const batch = docs.slice(i, i + 100);
      await Chroma.fromDocuments(batch, embeddings, {
        collectionName: COLLECTION_NAME,
      });
    }
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();
