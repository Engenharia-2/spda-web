# Configuração de CORS para Firebase Storage

O erro que você está vendo (`Access to XMLHttpRequest... blocked by CORS policy`) acontece porque o Firebase Storage, por padrão, bloqueia uploads feitos de um servidor local (`localhost`).

Para corrigir isso, precisamos aplicar uma configuração de CORS no seu bucket do Firebase.

## Passo a Passo

1.  **Acesse o Google Cloud Console**:
    *   Vá para [https://console.cloud.google.com/](https://console.cloud.google.com/)
    *   Certifique-se de selecionar o projeto correto (`spda-report`).

2.  **Abra o Cloud Shell**:
    *   Clique no ícone do terminal (>_) no canto superior direito da tela ("Activate Cloud Shell").

3.  **Crie o arquivo de configuração**:
    *   No terminal do Cloud Shell, digite o seguinte comando para criar o arquivo `cors.json`:
        ```bash
        nano cors.json
        ```
    *   Cole o seguinte conteúdo dentro do editor:
        ```json
        [
          {
            "origin": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"],
            "maxAgeSeconds": 3600
          }
        ]
        ```
    *   Pressione `Ctrl + O` e `Enter` para salvar.
    *   Pressione `Ctrl + X` para sair.

4.  **Aplique a configuração**:
    *   Execute o comando abaixo (substitua `spda-report.firebasestorage.app` pelo nome do seu bucket se for diferente):
        ```bash
        gsutil cors set cors.json gs://spda-report.firebasestorage.app
        ```

5.  **Pronto!**
    *   Aguarde alguns segundos e tente fazer o upload novamente no seu aplicativo local. O erro deve desaparecer.
