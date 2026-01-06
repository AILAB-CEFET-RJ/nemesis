
# =========================================================
# Imports
# =========================================================
import os
import re
import six
import math
import tarfile
import zipfile
import shutil
import string
import tempfile
import requests
import numpy as np
import argparse
import logging
from tqdm import tqdm
from pathlib import Path
from typing import IO

import mindspore as ms
import mindspore.nn as nn
import mindspore.ops as ops
import mindspore.dataset as ds
from mindspore.common.initializer import Uniform, HeUniform

# =========================================================
# Global paths
# =========================================================
CACHE_DIR = Path.home() / ".mindspore_examples"
CACHE_DIR.mkdir(exist_ok=True)

# =========================================================
# Logging
# =========================================================
def configure_logging(debug_enabled: bool) -> None:
level = logging.DEBUG if debug_enabled else logging.INFO
logging.basicConfig(
level=level,
format="%(asctime)s [%(levelname)s] %(message)s",
datefmt="%H:%M:%S",
)
logging.debug("Debug logging enabled.")

# =========================================================
# Download utilities
# =========================================================
def http_get(url: str, temp_file: IO):
req = requests.get(url, stream=True)
total = int(req.headers.get("Content-Length", 0))
progress = tqdm(total=total, unit="B", unit_scale=True)
for chunk in req.iter_content(chunk_size=1024):
if chunk:
temp_file.write(chunk)
progress.update(len(chunk))
progress.close()

def download(file_name: str, url: str):
cache_path = CACHE_DIR / file_name
if not cache_path.exists():
with tempfile.NamedTemporaryFile() as temp_file:
http_get(url, temp_file)
temp_file.flush()
temp_file.seek(0)
with open(cache_path, "wb") as f:
shutil.copyfileobj(temp_file, f)
return str(cache_path)

# =========================================================
# IMDB Dataset Loader
# =========================================================
class IMDBData:
label_map = {"pos": 1, "neg": 0}

def __init__(self, path, mode="train"):
self.docs, self.labels = [], []
self.path = path
self.mode = mode
self._load("pos")
self._load("neg")

def _load(self, label):
pattern = re.compile(rf"aclImdb/{self.mode}/{label}/.*\.txt$")
with tarfile.open(self.path) as tarf:
for member in tarf:
if pattern.match(member.name):
text = tarf.extractfile(member).read()
text = text.rstrip(six.b("\n\r"))
text = text.translate(None, six.b(string.punctuation))
text = text.lower().decode("utf-8").split()
self.docs.append(text)
self.labels.append([self.label_map[label]])

def __getitem__(self, idx):
return self.docs[idx], self.labels[idx]

def __len__(self):
return len(self.docs)

def load_imdb_dataset(imdb_tar):
train = ds.GeneratorDataset(IMDBData(imdb_tar, "train"),
column_names=["text", "label"],
shuffle=True)
test = ds.GeneratorDataset(IMDBData(imdb_tar, "test"),
column_names=["text", "label"],
shuffle=False)
return train, test

# =========================================================
# Load GloVe embeddings
# =========================================================
def load_glove(glove_zip):
glove_txt = CACHE_DIR / "glove.6B.100d.txt"
if not glove_txt.exists():
with zipfile.ZipFile(glove_zip) as z:
z.extractall(CACHE_DIR)

tokens, embeddings = [], []
with open(glove_txt, encoding="utf-8") as f:
for line in f:
word, vec = line.split(maxsplit=1)
tokens.append(word)
embeddings.append(np.fromstring(vec, sep=" ", dtype=np.float32))

embeddings.append(np.random.rand(100)) # <unk>
embeddings.append(np.zeros(100, np.float32)) # <pad>

vocab = ds.text.Vocab.from_list(
tokens,
special_tokens=["<unk>", "<pad>"],
special_first=False
)

return vocab, np.array(embeddings, dtype=np.float32)

# =========================================================
# Model Definition
# =========================================================
class RNN(nn.Cell):
def __init__(self, embeddings, hidden_dim, output_dim,
n_layers, bidirectional, pad_idx):
super().__init__()
vocab_size, emb_dim = embeddings.shape

self.embedding = nn.Embedding(
vocab_size,
emb_dim,
embedding_table=ms.Tensor(embeddings),
padding_idx=pad_idx
)

self.rnn = nn.LSTM(
emb_dim,
hidden_dim,
num_layers=n_layers,
bidirectional=bidirectional,
batch_first=True
)

self.fc = nn.Dense(
hidden_dim * 2,
output_dim,
weight_init=HeUniform(math.sqrt(5)),
bias_init=Uniform(1 / math.sqrt(hidden_dim * 2))
)

def construct(self, x):
x = self.embedding(x)
_, (hidden, _) = self.rnn(x)
hidden = ops.concat((hidden[-2], hidden[-1]), axis=1)
return self.fc(hidden)

# =========================================================
# Training & Evaluation
# =========================================================
def binary_accuracy(preds, labels):
preds = np.around(ops.sigmoid(preds).asnumpy())
return (preds == labels).mean()

def train_one_epoch(model, dataset, optimizer, loss_fn, epoch):
model.set_train()
total_loss = 0
steps = 0

def forward(x, y):
return loss_fn(model(x), y)

grad_fn = ms.value_and_grad(forward, None, optimizer.parameters)

with tqdm(dataset.create_tuple_iterator(), total=dataset.get_dataset_size()) as t:
t.set_description(f"Epoch {epoch}")
for x, y in t:
loss, grads = grad_fn(x, y)
optimizer(grads)
total_loss += loss.asnumpy()
steps += 1
t.set_postfix(loss=total_loss / steps)

def evaluate(model, dataset, loss_fn, epoch=0):
model.set_train(False)
total_loss, total_acc, steps = 0, 0, 0

with tqdm(dataset.create_tuple_iterator(), total=dataset.get_dataset_size()) as t:
t.set_description(f"Eval {epoch}")
for x, y in t:
preds = model(x)
loss = loss_fn(preds, y)
acc = binary_accuracy(preds, y)
total_loss += loss.asnumpy()
total_acc += acc
steps += 1
t.set_postfix(loss=total_loss / steps, acc=total_acc / steps)

return total_loss / steps

# =========================================================
# Prediction
# =========================================================
SCORE_MAP = {1: "Positive", 0: "Negative"}

def predict_sentiment(model, vocab, sentence):
model.set_train(False)
tokens = sentence.lower().split()
ids = vocab.tokens_to_ids(tokens)
tensor = ms.Tensor(ids, ms.int32).expand_dims(0)
pred = model(tensor)
return SCORE_MAP[int(np.round(ops.sigmoid(pred).asnumpy()))]

# =========================================================
# Main
# =========================================================
def main():
parser = argparse.ArgumentParser(
description="Sentiment classification with MindSpore RNN (IMDB)."
)
parser.add_argument(
"-d",
"--debug",
action="store_true",
help="Ativa logs detalhados de debug."
)
args = parser.parse_args()

configure_logging(args.debug)

logging.info("Preparando downloads (IMDB e GloVe).")
imdb_tar = download(
"aclImdb_v1.tar.gz",
"https://mindspore-website.obs.myhuaweicloud.com/notebook/datasets/aclImdb_v1.tar.gz"
)
glove_zip = download(
"glove.6B.zip",
"https://mindspore-website.obs.myhuaweicloud.com/notebook/datasets/glove.6B.zip"
)
logging.info("Downloads prontos. Cache: %s", CACHE_DIR)

logging.info("Carregando dataset IMDB...")
train_ds, test_ds = load_imdb_dataset(imdb_tar)
logging.info("Carregando vocabulÃ¡rio GloVe...")
vocab, embeddings = load_glove(glove_zip)
logging.debug("Vocab size: %d", len(vocab.vocab()))

lookup = ds.text.Lookup(vocab, unknown_token="<unk>")
pad = ds.transforms.PadEnd([500], vocab.tokens_to_ids("<pad>"))
cast = ds.transforms.TypeCast(ms.float32)

logging.info("Aplicando transforms...")
train_ds = train_ds.map([lookup, pad], ["text"]).map(cast, ["label"])
test_ds = test_ds.map([lookup, pad], ["text"]).map(cast, ["label"])

logging.info("Dividindo dataset de treino/validaÃ§Ã£o...")
train_ds, valid_ds = train_ds.split([0.7, 0.3])
train_ds = train_ds.batch(64, drop_remainder=True)
valid_ds = valid_ds.batch(64, drop_remainder=True)
test_ds = test_ds.batch(64)

logging.info("Inicializando modelo...")
model = RNN(
embeddings=embeddings,
hidden_dim=256,
output_dim=1,
n_layers=2,
bidirectional=True,
pad_idx=vocab.tokens_to_ids("<pad>")
)

loss_fn = nn.BCEWithLogitsLoss()
optimizer = nn.Adam(model.trainable_params(), learning_rate=1e-3)

best_loss = float("inf")
ckpt = CACHE_DIR / "sentiment-analysis.ckpt"

logging.info("Iniciando treinamento...")
for epoch in range(5):
train_one_epoch(model, train_ds, optimizer, loss_fn, epoch)
val_loss = evaluate(model, valid_ds, loss_fn, epoch)
if val_loss < best_loss:
best_loss = val_loss
ms.save_checkpoint(model, str(ckpt))
logging.info("Novo melhor loss %.4f. Checkpoint salvo em %s", best_loss, ckpt)

logging.info("Carregando melhor checkpoint e avaliando no teste...")
ms.load_param_into_net(model, ms.load_checkpoint(str(ckpt)))
evaluate(model, test_ds, loss_fn)

logging.info("PrediÃ§Ãµes de exemplo:")
logging.info("Negativo -> %s", predict_sentiment(model, vocab, "This film is terrible"))
logging.info("Positivo -> %s", predict_sentiment(model, vocab, "This film is great"))

if __name__ == "__main__":
main()