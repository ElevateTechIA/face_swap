# Configuracion de Firebase Auth (Google)

Esta app ya no usa NextAuth. Ahora el inicio de sesion con Google se maneja con Firebase Auth.

## 1) Crear proyecto en Firebase

1. Ve a https://console.firebase.google.com/
2. Crea un proyecto nuevo (o usa uno existente)
3. En el panel del proyecto, abre **Authentication**
4. En **Sign-in method**, habilita **Google**

## 2) Crear una app web en Firebase

1. En **Project settings**, agrega una **Web app**
2. Copia la configuracion del SDK (apiKey, authDomain, etc.)
3. Coloca esos valores en `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 3) Crear credenciales Admin (Service Account)

1. En **Project settings** > **Service accounts**
2. Genera una nueva key privada
3. Copia los campos en `.env.local`:

```
FIREBASE_ADMIN_PROJECT_ID=tu_proyecto
FIREBASE_ADMIN_CLIENT_EMAIL=tu_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=tu_private_key_con_saltos
```

Nota: La private key suele venir con saltos de linea. Mantenerla como una sola linea y con `\n`:

```
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
```

## 4) Dominios autorizados

1. En **Authentication** > **Settings** > **Authorized domains**
2. Asegura que `localhost` este permitido para desarrollo

## 5) Probar la app

1. Ejecuta `npm run dev`
2. Abre http://localhost:3000
3. Inicia sesion con Google

## Referencias

- Firebase Auth: https://firebase.google.com/docs/auth
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
