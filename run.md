# Passo a passo para rodar o projeto Fiscalize API

## 1. Pré-requisitos
- Docker e Docker Compose instalados
- Node.js (versão recomendada: 18+)
- Acesso ao painel do MinIO para obter as credenciais

## 2. Descubra o IP local da sua máquina
- No Linux, execute:
  ```sh
  ip a | grep inet 
  ```
- No Windows, execute:
  ```sh
  ipconfig
  ```
- No MacOS, execute:
  ```sh
  ifconfig | grep inet 

  ```
- Anote o IP local (exemplo: `192.168.1.12`). Ele será usado para configurar o MinIO.
> **Nota:** O IP local (LAN) normalmente começa com `192.168`. Por exemplo: `192.168.1.12`. Use esse IP para configurar o MinIO e acessar o painel.

## 3. Copie o arquivo de exemplo de ambiente
```sh
cp .env.example .env
```

## 4. Suba apenas o MinIO primeiro
```sh
docker-compose up fiscalize-minio -d
```
- Aguarde o container subir.
- Acesse o painel do MinIO: `http://<IP_LOCAL>:9001`
- Faça login com as credenciais padrão (`minioadmin`) ou as definidas no `.env`.
- Crie o bucket se necessário (ex: `fiscalizacao-demandas`).
- Copie as chaves de acesso (Access Key e Secret Key) para configurar no `.env`.

## 5. Configure o arquivo `.env`
- Abra o arquivo `.env` e ajuste as variáveis conforme necessário:
  - `MINIO_ENDPOINT`: coloque o IP local anotado no passo anterior
  - `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY`: cole as credenciais copiadas do painel do MinIO
  ```env
  MINIO_ENDPOINT=192.168.1.12
  MINIO_ACCESS_KEY=SEU_ACCESS_KEY
  MINIO_SECRET_KEY=SEU_SECRET_KEY
  ```

## 6. Suba o restante dos containers
```sh
docker-compose up fiscalize-postgres-db fiscalize-api -d --build
```
- Isso irá subir a API e o banco PostgreSQL.


## 7. Acesse o container da API via terminal
Para executar comandos diretamente dentro do container da API, use:
```sh
docker exec -it fiscalize-api-dev bash
```
- Você estará dentro do terminal do container, podendo rodar comandos como `ls`, `pnpm`, `node prisma/seed_V2.js` etc.

Se quiser listar os containers e conferir o nome, use:
```sh
docker ps
```
O nome do container da API normalmente será `fiscalize-api-dev`.

## 8. Rode db push e o seed do banco
```sh
cd /root/app
pnpm prisma db push
node prisma/seed_V2.js
pnpm prisma studio
```
-verifique os usuarios disponiveis em localhost:5555 pegue um que vai estar vinculado a 3 demandas 

## 9. Teste a API
- Acesse: `http://localhost:3000` para testar os endpoints
- Use o Swagger se disponível: `http://localhost:3000/docs`

---

Se tiver dúvidas ou problemas, verifique as variáveis do `.env` e se os containers estão rodando corretamente.
