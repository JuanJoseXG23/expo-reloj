# ⏱️ Señales de reloj y diagramas de tiempo

App web en tiempo real para acompañar la exposición de **Juan José Gómez Roldán, Cristian Murillo Ramírez y Renzo Olivieri García**
(Sistemas Digitales y Ensambladores · Politécnico Grancolombiano · docente Jaime Andrés Zurita López · Intel 8086).

- **Estudiantes:** abren el enlace (o el QR), escriben su nombre y entran. Nada más.
- **Expositores:** controlan todo desde `/#/panel`: desbloquean bloques, cambian pantallas y lanzan preguntas.
- **Video beam (perfil "presentación"):** `/#/presentacion` muestra **diapositivas** sincronizadas con la pantalla interactiva
  que tienen los estudiantes: cuando el expositor avanza, cambian las dos. En el lobby muestra el QR y los conectados con avatares.

Stack: Vite + React + TypeScript + Tailwind + Firebase (Auth anónima + Firestore). Se publica gratis en GitHub Pages.

---

## Índice

1. [Qué necesitas](#1-qué-necesitas)
2. [Crear el proyecto en Firebase](#2-crear-el-proyecto-en-firebase)
3. [Configurar la app en tu computador](#3-configurar-la-app-en-tu-computador)
4. [Crear la clave de expositor](#4-crear-la-clave-de-expositor-configsecret)
5. [Publicar las reglas de seguridad](#5-publicar-las-reglas-de-seguridad)
6. [Subir el código a GitHub](#6-subir-el-código-a-github)
7. [Secrets y GitHub Pages](#7-secrets-y-github-pages)
8. [Autorizar el dominio de GitHub en Firebase](#8-autorizar-el-dominio-de-github-en-firebase)
9. [Cómo se usa](#9-cómo-se-usa)
10. [Probar en local y pruebas automáticas](#10-probar-en-local-y-pruebas-automáticas)
11. [Seguridad explicada en sencillo](#11-seguridad-explicada-en-sencillo)
12. [Checklist del día de la exposición](#12-checklist-del-día-de-la-exposición)
13. [Problemas comunes](#13-problemas-comunes)
14. [Estructura del proyecto](#14-estructura-del-proyecto)

---

## 1. Qué necesitas

| Herramienta | Para qué | Cómo comprobar |
|---|---|---|
| [Node.js 20 o más](https://nodejs.org) | Compilar y probar la app | `node -v` |
| [Git](https://git-scm.com) | Subir el código | `git --version` |
| Cuenta de Google | Firebase | — |
| Cuenta de GitHub | Publicar la página | — |
| Firebase CLI | Publicar las reglas | `firebase --version` (si no: `npm install -g firebase-tools`) |
| [Java 21](https://adoptium.net/temurin/releases/?version=21) *(opcional)* | Solo para el emulador y las pruebas de reglas | `java -version` |

> ⚠️ Si `java -version` dice `1.8`, ese Java es muy viejo para el emulador. Instala **Temurin 21** (JDK, .msi) desde el enlace de arriba y abre una terminal nueva. **No es necesario** para publicar la app; solo para el paso 10.

Primero instala las dependencias, dentro de la carpeta del proyecto:

```bash
npm install
```

---

## 2. Crear el proyecto en Firebase

1. Entra a <https://console.firebase.google.com> → **Crear un proyecto** (o "Agregar proyecto").
2. Nombre: por ejemplo `expo-reloj`. **Desactiva Google Analytics** (no hace falta) → **Crear proyecto**.
3. **Activar el inicio de sesión anónimo:**
   - Menú izquierdo → **Compilación → Authentication** → **Comenzar**.
   - Pestaña **Método de acceso** → **Anónimo** → activar → **Guardar**.
4. **Crear la base de datos:**
   - Menú izquierdo → **Compilación → Firestore Database** → **Crear base de datos**.
   - Ubicación: `southamerica-east1 (São Paulo)` o `nam5 (United States)`. *No se puede cambiar después.*
   - Modo: **Producción** (las reglas las publicamos en el paso 5).
5. **Registrar la app web:**
   - Ícono ⚙️ (arriba a la izquierda) → **Configuración del proyecto** → sección **Tus apps** → botón **`</>`** (Web).
   - Apodo: `expo-reloj-web`. **No** marques "Firebase Hosting" → **Registrar app**.
   - Verás un bloque como este. **Déjalo abierto**, lo necesitas en el paso 3:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "expo-reloj-xxxxx.firebaseapp.com",
  projectId: "expo-reloj-xxxxx",
  storageBucket: "expo-reloj-xxxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

> El plan gratuito (**Spark**) alcanza de sobra: una exposición de 20 minutos con ~40 estudiantes usa unas 10.000–20.000 lecturas, y el límite gratis es de 50.000 por día.

---

## 3. Configurar la app en tu computador

1. Copia el archivo `.env.example` y renómbralo como **`.env.local`** (en la misma carpeta).
2. Pega los valores del paso 2.5:

```ini
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=expo-reloj-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=expo-reloj-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=expo-reloj-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
VITE_SESSION_ID=expo-reloj
```

3. Pruébalo: `npm run dev` y abre la dirección que aparece (por ejemplo <http://localhost:5173>).

> 💡 **¿Esta configuración es secreta?** No. Cualquier página web que usa Firebase la expone en el navegador; es normal.
> La seguridad real está en las **reglas de Firestore** (`firestore.rules`). Aun así, `.env.local` está en `.gitignore`
> para mantener el repositorio limpio, y en GitHub la ponemos como *secrets* (paso 7).

---

## 4. Crear la clave de expositor (`config/secret`)

La clave **no está en el código**: vive en un documento de Firestore que nadie puede leer desde la app.

1. Consola de Firebase → **Firestore Database** → pestaña **Datos** → **+ Iniciar colección**.
2. ID de la colección: **`config`** → Siguiente.
3. ID del documento: **`secret`** (escríbelo, no uses "ID automático").
4. Campo: **`presenterKey`** · Tipo: **string** · Valor: **`ADMIN123`** → **Guardar**.

Para cambiar la clave en el futuro, solo edita ese campo. (Los expositores ya validados siguen siéndolo.)

---

## 5. Publicar las reglas de seguridad

**Opción A — con la terminal (recomendada):**

```bash
firebase login
firebase deploy --only firestore:rules --project expo-reloj-xxxxx
```

(Cambia `expo-reloj-xxxxx` por tu `projectId`.)

**Opción B — desde la consola:** Firestore Database → pestaña **Reglas** → borra todo, pega el contenido de
[`firestore.rules`](firestore.rules) → **Publicar**.

---

## 6. Subir el código a GitHub

1. Entra a <https://github.com/new>.
   - Nombre: `expo-reloj` (o el que quieran).
   - Visibilidad: **Public** (GitHub Pages gratis requiere repositorio público).
   - **No** marques "Add a README" → **Create repository**.
2. En la carpeta del proyecto ejecuta (cambia `TU_USUARIO`):

```bash
git init
git add .
git commit -m "App de la exposición: señales de reloj"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/expo-reloj.git
git push -u origin main
```

> Revisa que `.env.local` **no** aparezca al hacer `git status` antes del commit (está en `.gitignore`).

---

## 7. Secrets y GitHub Pages

**Secrets** (la configuración de Firebase para que GitHub pueda compilar):

1. En tu repositorio: **Settings → Secrets and variables → Actions → New repository secret**.
2. Crea estos **6 secrets**, con los mismos valores de tu `.env.local`:

| Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `expo-reloj-xxxxx.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `expo-reloj-xxxxx` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `expo-reloj-xxxxx.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1234567890` |
| `VITE_FIREBASE_APP_ID` | `1:1234567890:web:abc123` |

**Activar GitHub Pages:**

1. **Settings → Pages** → en **Build and deployment → Source** elige **GitHub Actions**.
2. Ve a la pestaña **Actions** → workflow **"Publicar en GitHub Pages"** → **Run workflow** (o haz cualquier `git push` a `main`).
3. Cuando termine en verde ✅, tu app queda en:

```
https://TU_USUARIO.github.io/expo-reloj/
```

Cada `git push` a `main` vuelve a publicar automáticamente (primero corre las pruebas).

---

## 8. Autorizar el dominio de GitHub en Firebase

Sin esto, el inicio de sesión anónimo falla en GitHub Pages.

Consola de Firebase → **Authentication → Configuración (Settings) → Dominios autorizados → Agregar dominio** →
escribe **`TU_USUARIO.github.io`** → Agregar.

---

## 9. Cómo se usa

| Quién | Dirección | Qué hace |
|---|---|---|
| Estudiantes | `https://TU_USUARIO.github.io/expo-reloj/` | Nombre → Entrar → sala en vivo |
| Expositores | `…/expo-reloj/#/panel` | Panel de control |
| Video beam | `…/expo-reloj/#/presentacion` (o escribir **presentacion** como nombre al entrar) | Diapositivas + QR + avatares + resultados |
| Ensayo | `…/expo-reloj/#/presentacion/ensayo` | Recorre las diapositivas con ← → sin tocar la sesión en vivo |

**Para entrar como expositor** hay dos formas (solo la primera vez en cada dispositivo):
- En la pantalla de entrada, escribe **`ADMIN123`** como si fuera tu nombre → te lleva al panel.
- O abre `/#/panel`, elige tu nombre y escribe la clave.

**Flujo:**
1. En el portátil del video beam abre la página y escribe **presentacion** como nombre (o abre `/#/presentacion`).
   Doble clic = pantalla completa. Se ve el QR y, a medida que entran, los avatares de los compañeros.
   Si en ese portátil también validan `ADMIN123`, durante las preguntas se ve además "N de M respondieron" en vivo.
2. En el panel: **▶ Iniciar** → se desbloquea el Bloque 0 y empieza el cronómetro.
3. **Siguiente →** (o la tecla →) avanza. Al pasar a un bloque nuevo, se desbloquea solo y cambia "quién habla".
4. Preguntas: **Lanzar → Cerrar → Resultados**. Tecla **Q** hace ese ciclo con la pregunta sugerida.
5. La pregunta gancho se lanza en 0.2 y se revela en 3.6 (botón **Resultados** de "gancho").
6. En 4.3, **🏆 Mostrar a todos** publica el Top 5.
7. **🏁 Finalizar** desbloquea todo en modo repaso.
8. **↺ Reiniciar** (con confirmación) vuelve al lobby y borra respuestas y conectados.

Atajos del panel: `←` `→` pantallas · `U` desbloquear el siguiente bloque · `Q` lanzar/cerrar/resultados.

---

## 10. Probar en local y pruebas automáticas

```bash
npm test             # cálculos (tic, % en alto, MHz máx, ciclos 8086, bucle) + preguntas + todas las pantallas
npm run build        # compila como en GitHub
```

**Con el emulador (sin tocar tu proyecto real, requiere Java 21):**

```bash
# Terminal 1: emuladores de Auth y Firestore (+ interfaz en http://localhost:4000)
npm run emuladores

# Terminal 2: la app conectada a los emuladores
npm run dev:emulador
```

En <http://localhost:4000/firestore> crea a mano el documento `config/secret` con `presenterKey = ADMIN123`
(los datos del emulador se borran al cerrarlo).

**Pruebas de las reglas de seguridad** (levanta el emulador sola):

```bash
npm run test:reglas
```

Comprueba, entre otras: *clave incorrecta no crea expositor*, *un estudiante no puede desbloquear bloques*,
*no se puede responder fuera de tiempo ni por otro*, *las respuestas ajenas solo se ven en "resultados"*.

**Probar desde el celular en tu red local:** `npm run dev -- --host` y abre en el celular la dirección
`http://192.168.x.x:5173` que aparece (agrega esa IP en *Dominios autorizados* si usas Firebase real).

---

## 11. Seguridad explicada en sencillo

Cada dispositivo inicia una **sesión anónima invisible** (el estudiante no ve nada): así Firebase sabe
"quién es quién" sin pedir correo ni contraseña. Lo único que se guarda es el **nombre** que escribe el estudiante.

| Dato | ¿Quién lee? | ¿Quién escribe? |
|---|---|---|
| `config/secret` (la clave) | **Nadie** | **Nadie** (solo a mano en la consola) |
| `presenters/{uid}` | Solo el propio expositor | Solo uno mismo, **y solo si la clave coincide** con `config/secret` |
| `sessions/expo-reloj` (estado) | Todos | **Solo expositores** |
| `participants/{uid}` (conectados) | Todos | Cada quien el suyo |
| `answers/{pregunta_uid}` | La propia siempre; las de otros solo en "resultados"; expositores todo | Cada quien la suya, **solo con la pregunta abierta** |

¿Cómo funciona la clave sin servidor? La app intenta crear `presenters/{tu uid}` con la clave que escribiste.
La regla compara esa clave con `config/secret` (las reglas sí pueden leerlo; la app no). Si coincide, el documento
se crea y desde ahí eres expositor; si no, Firestore lo rechaza y la app dice **"Clave incorrecta"**.

Otros detalles:
- Las reglas validan campos y tipos (`keys().hasOnly(...)`), nombres de 2–40 caracteres sin `<` `>`.
- Los puntos del Top 5 los calcula el panel a partir de la opción elegida; no se confía en lo que diga el celular.
- El contenido de las pantallas está en el código de la página (no es secreto). Lo que sí está protegido es el
  **control** de la sesión, las respuestas y la clave.

**Modelo de datos (Firestore):**

```
config/secret                              { presenterKey }
presenters/{uid}                           { name, key, createdAt }
sessions/expo-reloj                        { status, unlockedBlocks, currentBlock, currentSlide, currentSpeaker,
                                             activeQuizId, quizState, showRanking, ranking, startedAt, updatedAt }
sessions/expo-reloj/participants/{uid}     { name, joinedAt, lastSeen }      ← latido cada 30 s
sessions/expo-reloj/answers/{quizId_uid}   { uid, name, quizId, option, correct, answeredAt }
```

(`ranking` = Top 5 que publica el panel; `startedAt` = inicio del cronómetro.)

---

## 12. Checklist del día de la exposición

**Un día antes**
- [ ] Abrir la URL publicada en un celular con datos móviles (no solo Wi-Fi) y entrar con un nombre de prueba.
- [ ] Validar la clave en el **portátil del panel** y en el **portátil del video beam** (con `ADMIN123`).
- [ ] Recorrer todas las pantallas con **Siguiente →** y lanzar una pregunta de prueba.

**30 minutos antes**
- [ ] Panel → **↺ Reiniciar** (borra las pruebas, vuelve al lobby).
- [ ] Video beam: entrar como **presentacion**, doble clic para pantalla completa, verificar que el QR se lee.
- [ ] Entrar con un celular de prueba y ver que el contador de conectados sube.
- [ ] Cargar el portátil, desactivar el modo de suspensión y las notificaciones.

**Plan B si falla internet**
- En el panel, botón **📶 En línea → 📴 Modo local**. Desde ese momento el panel y `/#/presentacion` **del mismo
  navegador** (dos pestañas o ventanas) se sincronizan sin Firestore y pueden recorrer todas las pantallas.
  Los celulares no se actualizan en este modo: la exposición sigue en el video beam.
- Para que funcione sin internet, la página debe estar ya abierta (cargada) antes de perder la conexión.
- Si falla Firebase pero hay internet, igual usa el modo local.
- Plan C: `npm run dev` en el portátil (con la carpeta del proyecto ya instalada) también sirve sin internet.

---

## 13. Problemas comunes

| Síntoma | Solución |
|---|---|
| "Sin conexión" en la sala / no carga en GitHub Pages | Falta el paso 8 (dominio autorizado) o la autenticación anónima (paso 2.3). |
| "Sin permiso: ¿publicaste las reglas?" en el panel | Repite el paso 5. |
| "Clave incorrecta" con la clave correcta | Revisa el paso 4: colección `config`, documento `secret`, campo `presenterKey` de tipo **string**, sin espacios. |
| La página de GitHub sale en blanco | Revisa que los 6 secrets existan (paso 7) y vuelve a ejecutar el workflow. |
| El workflow falla en "deploy" | Settings → Pages → Source debe ser **GitHub Actions**. |
| `npm run test:reglas` falla con error de Java | Instala Java 21 (ver sección 1) y abre una terminal nueva. |
| Un estudiante escribió mal su nombre | En el lobby: "No soy yo / cambiar nombre". |

---

## 14. Estructura del proyecto

```
src/
  firebase.ts                 configuración + sesión anónima invisible
  content/blocks.ts           bloques y pantallas (id, título, expositor, componente, tiempos)
  content/quizzes.ts          preguntas en vivo y cálculo del ranking
  components/timing/          <TimingDiagram /> genérico: señales, buses y relojes como datos
  components/quiz/            opciones y barras de resultados
  components/ui/              botones, sliders, tarjetas, "¿Ves?…", confeti
  slides/block0…block4/       las 28 pantallas interactivas
  hooks/                      useSession, useIdentity, usePresence, useQuiz, usePresenter, useAnimTime
  lib/calc.ts                 todos los cálculos (probados con Vitest)
  presentation/               diapositivas del video beam, lobby con QR y avatares
  lib/sessionStore.ts         Firestore o modo local (plan B)
  pages/                      Enter, Room (sala), Panel, Presentation (diapositivas), Rehearsal (ensayo)
firestore.rules               reglas de seguridad
tests/rules.test.ts           pruebas de reglas con el emulador
.github/workflows/deploy.yml  publicación automática en GitHub Pages
```

**Cambiar contenido:** los textos están en cada archivo de `src/slides/`; las preguntas, en `src/content/quizzes.ts`.
Después, `git add . && git commit -m "cambio" && git push` y en ~2 minutos queda publicado.
