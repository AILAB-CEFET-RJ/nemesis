from transformers import AutoTokenizer, AutoModel
import torch



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
    # Load a pre-trained transformer model for embeddings
    print('Loading model..')
    model_name = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    
    return model, tokenizer
