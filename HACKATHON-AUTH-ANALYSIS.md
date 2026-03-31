# Análisis: Reemplazar Auth + Stripe para Hackathon

## Contexto del problema

La app actual requiere:
1. **Registro/login** (better-auth con email+contraseña)
2. **Suscripción activa de Stripe** (básico, pro, advanced)

Para la hackathon necesitamos:
- Acceso sin registro ni pago
- Un `userId` por usuario (para aislar flashcards y datos)
- Límites de uso de IA para no quemar tokens

---

## Cómo funciona hoy el auth

### Backend — `requireAuth`
```
src/middleware/authMiddleware.ts
```
- Llama a `auth.api.getSession({ headers })` (better-auth)
- Si no hay sesión → 401
- Si hay sesión → guarda en `req.session`, continúa
- Los handlers sacan el userId con: `(req as any).session.user.id`

### Frontend — `ProtectedRoute`
```
src/components/ProtectedRoute.tsx
```
Hace DOS validaciones en serie:
1. `authClient.useSession()` → si no hay sesión → redirect `/login`
2. `authClient.subscription.list()` → si no hay suscripción activa → redirect `/plans`

### Dónde se usa `userId`
| Operación            | Cómo usa userId                                  |
|----------------------|--------------------------------------------------|
| `createDeck`         | `userId = req.session.user.id` → guarda en DB    |
| `getDecks`           | Filtra `WHERE userId = ?`                        |
| `getStories`         | Filtra `WHERE userId = ?`                        |
| `getStreak`          | Filtra `WHERE userId = ?`                        |
| `createFlashcard`    | No usa userId directo (lo hereda del deck)       |
| `upload/pdf` `image` | Solo verifica auth, no usa userId directamente   |

---

## Rate limiting actual

```
src/middleware/rateLimiter.ts
```

| Limiter             | Ventana  | Límite | Usado en                          |
|---------------------|----------|--------|-----------------------------------|
| `globalLimiter`     | 5 min    | 100    | Todas las rutas                   |
| `storyAILimiter`    | 1 hora   | 5      | `POST /stories/with-ia`           |
| `scribeTokenLimiter`| 3 min    | 3      | `GET /speech/scribe-token`        |
| `chatStreamLimiter` | 15 min   | 150    | `POST /speech/chat`               |
| `authSignInLimiter` | 15 min   | 5      | `/auth/sign-in`, `/auth/sign-up`  |

> El rate limiting actual es **por IP**, no por usuario.

---

## Estrategia propuesta para Hackathon

### Concepto: Sesión anónima con UUID

En lugar de login real, cada visitante recibe un **UUID persistente en cookie**.
Ese UUID actúa como `userId` para toda la app.

```
Visitante llega → No tiene cookie → Backend genera UUID → Guarda en cookie (7 días)
                → Tiene cookie    → Usa el UUID existente
```

**Ventajas:**
- Cero fricción para el usuario (ni email ni contraseña)
- Datos aislados por "usuario" (cada UUID tiene sus propios decks/flashcards)
- Rate limiting puede hacerse por UUID (más justo que por IP, que puede ser compartida)
- Se implementa sin tocar la DB de users ni better-auth

---

## Cambios necesarios

### BACKEND

#### 1. Nuevo middleware: `anonSession`
**Reemplaza `requireAuth` en todas las rutas**

```ts
// src/middleware/anonSession.ts
export async function anonSession(req, res, next) {
    let userId = req.cookies['anon_id'];
    if (!userId) {
        userId = crypto.randomUUID();
        res.cookie('anon_id', userId, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });
    }
    (req as any).session = { user: { id: userId } };
    next();
}
```

> La interfaz `req.session.user.id` es idéntica a la del auth real → los handlers no cambian.

#### 2. Rate limiting por userId (no por IP)
Mejorar los limiters existentes para usar el UUID como key:

```ts
// En lugar de keyGenerator por IP:
keyGenerator: (req) => req.cookies['anon_id'] || req.ip
```

Esto evita que usuarios detrás del mismo router compartan cuota.

#### 3. Nuevo limiter para endpoints de IA
Agregar límites diarios por usuario para los 3 endpoints que cuestan tokens:

| Endpoint              | Límite sugerido (hackathon) | Ventana |
|-----------------------|-----------------------------|---------|
| `POST /upload/pdf`    | 3 por usuario               | 24 horas|
| `POST /upload/image`  | 5 por usuario               | 24 horas|
| `POST /speech/chat`   | ya existe (chatStreamLimiter)| 15 min |
| `GET /speech/scribe-token` | ya existe (scribeTokenLimiter) | 3 min |
| `POST /stories/with-ia`| ya existe (storyAILimiter) | 1 hora |

#### 4. Quitar/ignorar better-auth y Stripe del server
- Comentar o eliminar el `ALL /api/auth/*` handler de `server.ts`
- No inicializar el cliente Stripe (ahorra tiempo de arranque)
- Agregar `cookie-parser` middleware (necesario para leer cookies)

#### 5. Archivos a modificar
```
src/middleware/authMiddleware.ts   → reemplazar con anonSession
src/middleware/rateLimiter.ts      → añadir limiters para /upload/pdf e /upload/image
                                    → cambiar keyGenerator a usar cookie
src/server.ts                      → quitar auth handler, añadir cookie-parser
src/lib/auth.ts                    → no tocar (o quitar si no se usa)
```

---

### FRONTEND

#### 1. Simplificar `ProtectedRoute`
Eliminar las dos validaciones (session + subscription).
Solo renderizar el layout con Header + Outlet:

```tsx
// src/components/ProtectedRoute.tsx — versión hackathon
export function ProtectedLayout() {
    return (
        <div className="bg-gradient-to-br from-neutral-950 ...">
            <Toaster position="top-right" />
            <Header />
            <div className="container mx-auto px-4 py-8">
                <Outlet />
            </div>
        </div>
    );
}
```

#### 2. Quitar rutas públicas de auth
En `App.tsx`, eliminar:
- `<Route path="/login" element={<SignIn />} />`
- `<Route path="/register" element={<SignUp />} />`
- `<Route path="/plans" element={<ListPlans />} />`

(O dejarlas pero que no sean accesibles desde el Header)

#### 3. Header — quitar botón de logout/login
El Header probablemente muestra el nombre/avatar del usuario y un botón de logout.
Para la hackathon, o se oculta o se reemplaza por algo decorativo.

#### 4. Componentes que usan `authClient.useSession()`
Buscar todos los componentes que hacen:
```ts
const { data } = authClient.useSession();
const userId = data?.user.id;
```
Para la hackathon, el backend maneja el userId en la cookie, así que el front **no necesita conocer el userId**. Las llamadas a la API ya incluyen la cookie automáticamente (`withCredentials: true` en axios).

**Excepción:** Si algún componente usa `data.user.id` para llamar a `authClient.subscription.list()` → eliminar esa lógica.

#### 5. Archivos a modificar
```
src/components/ProtectedRoute.tsx          → eliminar checks de auth y subscription
src/App.tsx                                → quitar rutas /login, /register, /plans
src/components/layouts/Header.tsx          → quitar menú de usuario/logout
src/components/stories/GenerateStory.tsx   → quitar check de límite de subscription
```

---

## Flujo final (hackathon)

```
Usuario visita la app
        ↓
Frontend: renderiza todo sin checks (ProtectedLayout simplificado)
        ↓
Cualquier llamada a la API incluye la cookie automáticamente
        ↓
Backend: anonSession middleware lee/genera UUID en cookie
         → req.session.user.id = UUID
        ↓
Handler usa userId normalmente (sin cambios en handlers)
        ↓
Rate limiter evalúa por UUID: ¿superó el límite de IA?
  SÍ → 429 Too Many Requests
  NO → procesa y descuenta cuota
```

---

## Lo que NO cambia

- Todos los handlers (`flashcard.ts`, `upload.ts`, etc.) → sin cambios
- Modelos de DB (Deck, Flashcard, etc.) → sin cambios
- La lógica de negocio completa → sin cambios
- El axios client del front (`withCredentials: true`) → sin cambios
- Los rate limiters existentes para speech y stories → se mantienen

---

## Resumen de archivos a tocar

### Backend (4-5 archivos)
| Archivo | Cambio |
|---------|--------|
| `src/middleware/authMiddleware.ts` | Reemplazar con lógica de cookie anónima |
| `src/middleware/rateLimiter.ts` | Añadir limiters para /upload, cambiar keyGenerator |
| `src/server.ts` | Añadir cookie-parser, quitar auth handler |
| `package.json` | Añadir `cookie-parser` como dependencia |

### Frontend (3-4 archivos)
| Archivo | Cambio |
|---------|--------|
| `src/components/ProtectedRoute.tsx` | Eliminar auth + subscription checks |
| `src/App.tsx` | Quitar rutas /login /register /plans |
| `src/components/layouts/Header.tsx` | Quitar menú de usuario |
| `src/components/stories/GenerateStory.tsx` | Quitar check de límite subscription |
