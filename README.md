# LifeFlow Frontend

Frontend do LifeFlow: React, TypeScript e Vite.

## Desenvolvimento local

Requisitos: Node.js 20 ou superior e npm.

```bash
npm ci
npm run dev
```

Por padrão, o Vite encaminha chamadas `/api` para `http://localhost:8080`. Para apontar para outro backend local, defina `VITE_API_TARGET` antes de iniciar o Vite.

## Testes e build

```bash
npm test
npm run typecheck
npm run build
```

## Deploy na Vercel

Configure a raiz do projeto como `.` (raiz deste repositório). O `vercel.json` encaminha `/api/*` ao backend LifeFlow no Render, mantendo as requisições da aplicação na mesma origem para a sessão e o token CSRF. Alterar o endereço do backend exige atualizar `vercel.json` e publicar uma nova versão.
