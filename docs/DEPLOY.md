DEPLOY DO NEMESIS
==================

Requisitos
----------
- Docker e Docker Compose instalados.
- Porta 8080 livre no host (Caddy expõe :8080).
- Variáveis de ambiente definidas em `deploy/.env` (copie de `deploy/env.example`).

Passo a passo de implantação
----------------------------
1) Preparar ambiente:
   - Clone o repositório: `git clone <repo> nemesis && cd nemesis/deploy`.
   - Copie o exemplo de env: `cp env.example .env` e preencha `POSTGRES_*`, `OPENAI_*`, `CORS_ORIGINS`, `REACT_APP_API_BASE_URL`.
2) Subir stack (db, backend, proxy/Caddy):
   ```
   cd ~/nemesis/deploy
   docker compose up -d --build
   ```
3) Testar health e API:
   - Health do proxy: `curl -I http://localhost:8080/health`.
   - API via proxy: `curl -i "http://localhost:8080/nemesis/api/sobrepreco?ano=2019&descricao=fornecimento%20de%20agua"`.
4) Nginx (se houver) deve apenas encaminhar `/nemesis` para `127.0.0.1:8080`:
   ```
   location /nemesis/ {
       proxy_pass http://127.0.0.1:8080$request_uri;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

Atualizar deploy
----------------
1) Puxe mudanças e reconstruir proxy/backend:
   ```
   cd ~/nemesis
   git pull
   cd deploy
   docker compose up -d --build proxy backend
   ```
2) Se o Caddyfile mudar, sempre refaça o build do proxy.

Logs e diagnóstico
------------------
- Estado dos serviços: `docker compose ps`.
- Logs específicos: `docker compose logs proxy --tail=200` (ou backend/db).
- API direta: `curl -i "http://localhost:8080/nemesis/api/sobrepreco?ano=2019&descricao=..."`
  (evite `curl -I` porque o endpoint aceita só GET).

Subida automática após reboot
-----------------------------
Opção rápida (política de restart)
----------------------------------
Adicione em `deploy/docker-compose.yml` para cada serviço:
```
restart: unless-stopped
```
Depois aplique:
```
cd ~/nemesis/deploy
docker compose down
docker compose up -d --build
```
Com o serviço Docker habilitado no boot, os containers voltam sozinhos.

Opção via systemd (mais controle)
---------------------------------
1) Crie `/etc/systemd/system/nemesis-compose.service` (sudo):
```
[Unit]
Description=Nemesis stack
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=/home/ebezerraroot/nemesis/deploy
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
RemainAfterExit=yes
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```
2) Habilite e inicie:
```
sudo systemctl daemon-reload
sudo systemctl enable --now nemesis-compose
```
3) Verifique status: `systemctl status nemesis-compose`.

Notas rápidas
-------------
- Dados do Postgres persistem em volume `db_data`.
- Modelos baixados ficam no volume `models_cache`.
- O frontend é servido em `/nemesis`; a API em `/nemesis/api`.
