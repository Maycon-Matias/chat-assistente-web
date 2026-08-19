# BotZao com Gemini (local)

## 1) Instalar dependencias

```bash
npm install
```

## 2) Configurar ambiente

1. Copie `.env.example` para `.env`
2. Preencha `GEMINI_API_KEY` com a chave do Google AI Studio:
   https://aistudio.google.com/app/apikey

## 3) Iniciar servidor

```bash
npm start
```

Servidor padrao: `http://localhost:8787`

## 4) Usar o chatbot

Abra `botzao.html` no navegador.
Ele enviara as mensagens para `http://localhost:8787/api/chat`.
