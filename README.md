# Face Clone - AI Face Swap App

Aplicacion de intercambio de rostros con IA usando Next.js y Gemini API.

## Caracteristicas

- Face Swap con IA usando Gemini 2.5 Flash Image Preview
- Analisis de rasgos faciales
- Generacion de captions para Instagram
- Plantillas predisenadas y estilos personalizables
- Interfaz moderna

## Requisitos

- Node.js 18+
- NPM o Yarn
- API Key de Google Gemini
- Proyecto de Firebase con Auth habilitado

## Instalacion

1. Clona o usa este directorio

2. Instala dependencias
   ```bash
   npm install
   ```

3. Configura variables de entorno

   Edita `.env.local` y agrega:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=tu_api_key_aqui
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   FIREBASE_ADMIN_PROJECT_ID=tu_proyecto
   FIREBASE_ADMIN_CLIENT_EMAIL=tu_service_account_email
   FIREBASE_ADMIN_PRIVATE_KEY=tu_private_key_con_saltos
   ```

   Para obtener credenciales:
   - Gemini: https://aistudio.google.com/app/apikey
   - Firebase Auth: ver `GOOGLE_OAUTH_SETUP.md` (actualizado a Firebase Auth)

4. Ejecuta el servidor de desarrollo
   ```bash
   npm run dev
   ```

5. Abre en el navegador
   - http://localhost:3000

## Uso

1. Encuesta inicial para personalizar la experiencia
2. Selecciona una plantilla o sube tu propia imagen
3. Sube tu rostro
4. Analiza rasgos (opcional)
5. Prepara el swap y selecciona un estilo
6. Inicia el swap
7. Descarga el resultado

## Tecnologias

- Next.js 16
- TypeScript
- Tailwind CSS
- Lucide React
- Gemini API
  - gemini-2.5-flash-preview: analisis de texto
  - gemini-2.5-flash-image-preview: face swap
- Firebase Auth

## Estructura del Proyecto

```
FACE_SWAP_NEXTJS/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   └── firebase/
├── .env.local
├── .env.example
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── package.json
```

## Comandos Disponibles

```bash
npm run dev
npm run build
npm start
npm run lint
```

## Notas Importantes

- Mantiene tus keys privadas y no las comitees
- La API de Gemini tiene limites de uso
- Algunas imagenes de Unsplash pueden tener restricciones CORS

## Solucion de Problemas

- Si el servidor no inicia: borra `node_modules` y `.next`, luego `npm install`
- Si falla la API: verifica las variables de entorno

## Licencia

ISC
