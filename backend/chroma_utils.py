from chromadb import PersistentClient
from langchain_community.vectorstores import Chroma

from transformers import AutoTokenizer, AutoModel
import torch
import yaml


def similarity_search(collection, embed_query, unidade, credor, elem_despesa, threshold=10):
        
    conditions = []
    where = {}
    if unidade:
        conditions.append({"Unidade": unidade})
        where["Unidade"] = unidade
    if credor:
        conditions.append({"Credor": credor})
        where["Credor"] = credor
    if elem_despesa:
        conditions.append({"ElemDespesaTCE": elem_despesa})
        where["ElemDespesaTCE"] = elem_despesa
    
    if len(conditions) > 1:
        where = {"$and": conditions}
    
    if embed_query is not None:
        results = collection.query(
            query_embeddings=[embed_query],
            n_results=1000,
            where = {"$and": conditions},
            include=["documents", "metadatas", "distances"]
        )
        
        filtered = [
            {
                "document": doc,
                "metadata": meta,
                "distance": dist
            }
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )
            if dist <= threshold
        ]
        return filtered
    else:
        results = collection.get(
            where=where,
            include=["documents", "metadatas"]
        )
        
            # Convert dict-of-lists to list-of-dicts
        normalized = [
            {
                "document": doc,
                "metadata": meta,
                "distance": None  # no similarity score
            }
            for doc, meta in zip(results["documents"], results["metadatas"])
        ]

        return normalized
    

    
def create_embeddings(samples, model, tokenizer, batch_size=64):
    all_embeddings = []

    for i in range(0, len(samples), batch_size):
        batch = samples[i:i+batch_size].tolist()
        inputs = tokenizer(batch, padding=True, truncation=True, return_tensors='pt')
        with torch.no_grad():
            outputs = model(**inputs)
            embeddings = outputs.last_hidden_state.mean(dim=1)  # Average pooling
            all_embeddings.append(embeddings)

    return torch.cat(all_embeddings, dim=0).numpy()

def load_model_tokenizer():
    # Open config file
    with open('config.yaml') as f:
        config = yaml.safe_load(f)
        
    # Load a pre-trained transformer model for embeddings
    print('Loading model..')
    model_name = config['embedding_model']
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    
    return model, tokenizer


def load_vector_store(model):
    
    # Define where your DB was saved
    persist_dir = 'chroma/'

    # Reconnect to the persisted DB
    persistent_client = PersistentClient(path='chroma/')

    # Reconnect to the vector store
    vector_store = Chroma(
        client=persistent_client,
        collection_name="my_collection",
        embedding_function=model,
        persist_directory=persist_dir,
    )
    
    collection = persistent_client.get_collection("my_collection")
    
    return vector_store, persistent_client, collection
