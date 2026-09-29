# ◆ NegraLuna HomeStudio · Mapa Vivo

Un mapa de nodos para explorar los proyectos, servicios, ubicación
y contacto del estudio. Todo el contenido vive en la carpeta
**`contenido/`** — lo editas, recargas la página y aparece.

---

## 1 · Cómo abrirla en tu PC (30 segundos)

**Importante: no abras `index.html` con doble clic.** Los navegadores
bloquean la lectura de archivos locales y la página no podría ver tu
carpeta `contenido/`. Se abre así:

1. Instala Python si no lo tienes (gratis): https://www.python.org/downloads/
   - En Windows, marca **"Add Python to PATH"** al instalar.
2. **Doble clic** en:
   - Windows → `iniciar-servidor.bat`
   - Mac / Linux → `iniciar-servidor.command` (si pide permiso: clic derecho ▸ Abrir)
3. Se abre tu navegador en `http://localhost:8123`. ¡Listo!

> También a mano: `python3 servir.py` dentro de esta carpeta.
> Para detener: cierra la ventana o pulsa `Ctrl + C`.

**El ciclo de trabajo:** abres con el lanzador una vez · editas lo que
quieras en `contenido/` · recargas la página (F5) · ves el cambio.

## 2 · Dónde está cada dato

```
contenido/
├── contacto/
│   ├── redes.txt         ← tus redes sociales (Nombre | https://...)
│   ├── mail.txt          ← tu correo (primera línea)
│   ├── telefono.txt      ← tu WhatsApp (primera línea: +56 9 ...)
│   └── escribenos.txt    ← texto del formulario
├── donar/
│   ├── donar.txt         ← agradecimiento del nodo Donaciones
│   ├── cuenta.txt        ← datos de transferencia (línea por dato)
│   └── donadores.txt     ← historial: una línea por donador
├── blog/
│   ├── blog.txt          ← texto del muro de comentarios
│   └── comentarios.txt   ← comentarios sembrados por el estudio
├── proyectos/
│   ├── negra-luna/       (biografia, hitos, fotos/, videos/, musica/)
│   ├── luna-errante/     (igual + discotopia/juego.txt)
│   ├── negra-cumbia/
│   └── simple-mortal/
├── podcast/
│   └── orbita-lunar/
│       ├── presentacion.txt  ← texto del nodo Órbita Lunar
│       ├── audio/            ← capítulos .mp3 (+ capitulos.txt)
│       ├── video/            ← capítulos .mp4 o links YouTube (+ capitulos.txt)
│       └── fotos/            ← imágenes del podcast
├── musica-fondo/         ← canciones de la Radio NegraLuna
├── servicios/            ← un .txt por servicio + fotos/
└── ubicacion.txt         ← referencias del lugar
```

- **Fotos:** copia tus `.jpg` / `.png` dentro de la carpeta `fotos/`
  de cada proyecto o servicio (puedes borrar las que vienen).
- **Videos y música:** igual — `.mp4` en `videos/`, `.mp3` en `musica/`.
- **Radio NegraLuna:** copia tus canciones `.mp3` en `contenido/musica-fondo/`
  y el widget de la esquina inferior izquierda las lanza al azar
  (ver sección 12). Cuando alguien reproduce un audio o video dentro
  de un nodo, la radio se calla sola y vuelve al terminar si quedó en ON.

## 3 · El formulario de contacto

El botón **"Enviar por WhatsApp"** usa el número de la primera línea
de `contacto/telefono.txt` (formato: `+56 9 1234 5678`).
El botón **"Enviar por correo"** usa `contacto/mail.txt`.

Mientras el teléfono tenga `XXXX`, el botón de WhatsApp permanece
oculto. Pones tu número real, recargas, y aparece.

## 4 · El juego Discotopía (Luna Errante)

El juego vive en `juego-discotopia/` y corre DENTRO de la misma
página: al pulsar **"Insertar moneda · JUGAR"** (nodo Proyectos ▸
Luna Errante ▸ Discotopía ▸ Juego) se abre en pantalla completa
sobre el mapa, **sin ventanas ni pestañas nuevas** — la dirección
web nunca cambia. Vuelves al mapa con **Esc**, con el botón verde
**"VOLVER AL MAPA"** del juego o con la **✕** de arriba a la
derecha, y sigues justo donde estabas. Como todo viaja por rutas
relativas del mismo sitio, funciona igual en tu PC, en el preview
y en tu dominio propio.

**Canciones:** copia tus audios (mp3, wav, ogg, m4a, flac) en
`contenido/proyectos/luna-errante/discotopia/juego/audios/`
— el reproductor del juego los arma solo, en orden alfabético,
con teclas 1-9 y auto-avance.

**Efectos:** los 4 sonidos del juego van en esa misma carpeta,
subcarpeta `efectos/`: disparo, explosion, game over y vida extra
(valen los nombres con espacios, el juego los encuentra igual).

Si editas la carpeta con la página abierta, recarga el juego (F5).

## 5 · Discotopía ahora es un mundo: Historia ▸ Videos ▸ Música ▸ Juego

El nodo Discotopía se abre en 4 ramas:

- **Mundo Discotopía** — la historia: escribe en
  `contenido/proyectos/luna-errante/discotopia/mundo/mundo.txt`
  y ponle fotos en esa misma carpeta (`fotos/`).
- **Videos** — enlaces de YouTube en
  `contenido/proyectos/luna-errante/discotopia/videos/videos.txt`
  (uno por línea, con título si quieres: `Título | URL` — se incrustan
  solos). También vale soltar `.mp4` directo en esa carpeta.
  Lo mismo funciona para los videos de cada banda.
- **Música** — tus `.mp3` en
  `contenido/proyectos/luna-errante/discotopia/musica/`.
  Ojo: es el reproductor del sitio; la música DENTRO del juego
  vive en `juego/audios/` (sección 4).
- **Juego** — igual que siempre (sección 4).

## 6 · La Tienda (nodo propio)

La tienda se arma sola: **una carpeta = un producto**. Creas la
carpeta, sueltas los archivos y recargas la página (F5).

```
contenido/tienda/
├─ tienda.txt                ← texto de bienvenida de la tienda
├─ polera-negra-luna/        ← UNA CARPETA = UN PRODUCTO
│  ├─ producto.txt           ← nombre, precio y descripción
│  └─ fotos/foto-01.png      ← la foto del escaparate
├─ polar-luna-errante/ …
└─ _modelo-producto/         ← plantilla copiable (las carpetas
                              que empiezan con _ NO se publican)
```

**Cómo cargar un producto, paso a paso:**

1. Crea una carpeta nueva dentro de `contenido/tienda/` con el nombre
   de tu producto (en minúsculas y con guiones es lo más seguro:
   `polar-negro`).
2. Adentro un `producto.txt`: la **1ª línea es el nombre** que se
   muestra, una línea `Precio: $8.000` (o `Valor:`) se ve destacada,
   y el resto es la descripción (vale `## subtítulos` y `- listas`).
   Si el txt se llama distinto también funciona, pero lo canónico es
   `producto.txt`.
3. La foto va en `fotos/` (o suelta en la carpeta del producto). La
   primera imagen en orden alfabético es la del escaparate. Sirven
   .jpg .png .webp .gif .svg — da igual mayúsculas (.PNG = .png) y
   los espacios en el nombre no molestan.
4. **Recarga la página (F5)**: la tienda lee `contenido/` en cada
   carga, no hace falta reiniciar el servidor.
5. Para quitar un producto del aire: borra su carpeta (o renómbrala
   con `_` delante) y recarga.

**Ojo:** si creas tu producto DENTRO de `_modelo-producto/` no va a
aparecer nunca — esa carpeta es una plantilla oculta. Siempre la
carpeta del producto directo en `contenido/tienda/`.

Los 4 productos que ya vienen cargados (polera, polerón, disco y
taza) son de **ejemplo con fotos generadas por IA**: úsalos de guía
del formato y bórralos o edítalos cuando cargues tu mercha real.

**Pedidos:** cada tarjeta trae botones *Encargar por WhatsApp* y
*Encargar por correo* que leen `contacto/telefono.txt` y
`contacto/mail.txt`. El mensaje llega pre-escrito con el nombre
del producto; mientras el teléfono tenga `XXXX` solo aparece
el botón de correo.

## 7 · El contador de visitas y el premio del visitante mil

- El conteo lo lleva el servidor en `visitas-estado.json` (se crea
  solo, junto a `contenido/`). Cada navegador cuenta **una vez por
  sesión**: refrescar no infla el número.
- El chip `N visitas` vive junto a los controles del HUD.
- Cuando alguien llega a la visita **1.000, 2.000, 3.000…** la
  página celebra al visitante con su premio y botones para
  reclamarlo por WhatsApp o correo (te llega a ti con el número de
  visita; tú coordinas la entrega).
- **El premio se escribe en `contenido/visitas/premio.txt`**: la
  1ª línea es el premio, el resto es el detalle que verá el
  ganador.
- El contador necesita el servidor con API: funciona con
  `iniciar-servidor` (y con cualquier hosting que corra servir.py
  o el servidor Next). En un hosting 100% estático el chip se
  oculta solo — nunca muestra números inventados.

## 8 · Donaciones: cuenta, agradecimiento e historial de donadores

El nodo **Donaciones** (corazón del mapa) junta tres cosas, todas
editables en `contenido/donar/`:

- **El agradecimiento** — `donar.txt`: el texto que explica por qué
  donar (ya dice "gracias a tu donación podemos seguir trabajando
  en nuestra música"); edítalo a tu estilo.
- **La cuenta para transferir** — `cuenta.txt`: una línea por dato
  con el formato `Etiqueta: valor` (`Banco: BancoEstado`,
  `Número de cuenta: ...`). La página muestra cada línea con su
  botón **Copiar**. Los datos que vienen son de ejemplo: pon los
  tuyos.
- **El historial de donadores** — `donadores.txt`: una línea por
  donador con el formato `Nombre | $monto`:

  ```
  Camila Rojas | $15.000
  Diego Fuentes | $10.000
  ```

  La web los ordena **sola, del aporte más alto al más bajo**, y
  el podio (los 3 primeros) lleva el sello **"Destacado en
  redes"** — lo mismo que promete el texto: al donador se le
  destaca en tus redes sociales. Para agregar a alguien: una
  línea nueva y F5. Para quitar: borra la línea.

Los 5 donadores que vienen son **de ejemplo**: reemplázalos por
los reales cuando empiecen a llegar aportes.

Los botones *"Quiero donar"* abren WhatsApp o el correo con el
mensaje listo para coordinar (usan `contacto/telefono.txt` y
`contacto/mail.txt` igual que el resto del sitio).

## 9 · Redes sociales en Contacto

Dentro del nodo **Contacto ▸ Redes sociales** la página muestra
**a la cabeza el nombre del proyecto** (NegraLuna HomeStudio) y
**debajo un enlace por cada red** que escribas en
`contenido/contacto/redes.txt`, una línea por red:

```
Instagram | https://instagram.com/tu-cuenta
YouTube | https://youtube.com/@tu-cuenta
TikTok | https://tiktok.com/@tu-cuenta
```

El nombre de la izquierda y el enlace se abren en pestaña nueva.
Cualesquiera redes sirven (Facebook, Spotify, SoundCloud, lo que
quieras) — la página reconoce el nombre y le pone un ícono
acorde. Las 5 que vienen son de ejemplo: cambia las URL por las
tuyas y recarga.

## 10 · El muro de comentarios (nodo Comentarios)

El nodo **Comentarios** es un mini-blog donde la gente deja sus
apreciaciones. Dos formas de comentar, y las dos llegan al muro:

- **Con servidor** (iniciar-servidor o el preview): se escribe
  nombre + comentario y el botón **"Publicar en el muro"** lo
  guarda por la API `/api/comentarios` (almacenados en
  `comentarios-estado.json`, junto a `contenido/`) y aparece al
  instante. Hasta 200 comentarios guardados, nombre de 40 y
  texto de 600 caracteres como máximo.
- **Sin API** (hosting solo estático): los botones *WhatsApp* y
  *correo* envían el comentario pre-escrito, y tú lo agregas al
  muro editando `contenido/blog/comentarios.txt`.

**Para moderar:**
- Los comentarios de visitantes viven en `comentarios-estado.json`
  — abre con el Bloc de notas, borra lo que no quieras y recarga.
- Tus propios comentarios destacados van en
  `contenido/blog/comentarios.txt`: un comentario por bloque,
  primera línea `Nombre | fecha`, luego el texto, y una línea
  vacía entre comentario y comentario. Esos se muestran primero
  (son los curados del estudio).
- El texto del nodo se edita en `contenido/blog/blog.txt`.

## 11 · El podcast Órbita Lunar (nodo propio)

El mapa tiene un nodo **Órbita Lunar** (ícono de micrófono) con dos
ramas: **Capítulos de audio** y **Capítulos de video**. El texto de
presentación se edita en `contenido/podcast/orbita-lunar/presentacion.txt`.

**Subir un capítulo de audio (30 segundos):**
1. Copia tu `.mp3` dentro de `contenido/podcast/orbita-lunar/audio/`
   (nómbralo `01…`, `02…` para mantener el orden).
2. Si quieres título y descripción bonitos, agrega una línea en
   `contenido/podcast/orbita-lunar/audio/capitulos.txt`:
   ```
   01-bienvenida.mp3 | Episodio 1 · Despegue | De qué va esta órbita
   ```
   (si no lo agregas, la página usa el nombre del archivo como título).
3. Recarga la página (F5): el capítulo aparece con su número EP,
   título, descripción y botón de reproducción.

**Subir un capítulo de video:** igual, pero en
`contenido/podcast/orbita-lunar/video/` — copia el `.mp4` y/o pega
un enlace de YouTube en `video/capitulos.txt` (una línea por
capítulo: `enlace | Título`). Los enlaces de YouTube se muestran
incrustados y reproducibles ahí mismo.

Las imágenes del podcast van en `podcast/orbita-lunar/fotos/`.

## 12 · Radio NegraLuna (el reproductor de la esquina)

Abajo a la izquierda vive un widget **fuera de los nodos**: la
**Radio NegraLuna**. Cómo funciona:

- **Arranca encendida**: al abrir la página lanza una canción al
  azar de `contenido/musica-fondo/`; al terminar, sigue con otra al
  azar (sin repetir la misma apenas terminó). Si el navegador pide
  un primer toque para permitir el sonido, suena al primer clic.
- **ON / OFF cuando quieras**: el botón del widget apaga o enciende
  la radio. Si la apagas, se queda en pausa; si la enciendes, sigue
  donde iba.
- **Regla de oro**: cuando alguien reproduce un **audio o un video
  dentro de un nodo** (o abre el juego Discotopía), la radio se
  calla sola. Al terminar esa reproducción —o al cerrar el panel—
  la radio **vuelve sola**, pero solo si el interruptor quedó en ON.
- **Sus canciones:** son las que pongas en `contenido/musica-fondo/`.
  Las 3 que vienen (deriva-estelar, polvo-de-luna, amanecer-en-pinto)
  son tonos de ambiente generados como demo — reemplázalas por tu
  música con solo copiar tus `.mp3` ahí y recargar.
- Sin canciones en esa carpeta, la radio no aparece: nada falso en
  pantalla.

## 13 · Visualizador de música (estilo Windows Media Player clásico)

Cuando alguien reproduce una pista en un nodo **Reproductor de música**
de cualquier proyecto (o en el podcast de audio), se abre **una
ventana flotante** con un visualizador que dibuja figuras al ritmo de
la música, inspirado en el Windows Media Player antiguo.

- **4 modos de visualización** que cambias con el botón `IFn`:
  *Barras* (espectro clásico), *Ondas* (osciloscopio),
  *Flor* (pétalos concéntricos), *Anillos* (espikeos rotantes).
- **Controles del reproductor**: ⏮ anterior · ⏭ siguiente ·
  ▶/❚❚ play-pausa · barra de progreso · volumen · cambio de modo.
- **Auto-siguiente**: cuando una canción termina, **suena la siguiente
  automáticamente** (y al acabar la última, vuelve a la primera — bucle).
- **Atajos de teclado**: `Espacio` = play/pausa · `Esc` = cerrar ·
  `Shift + →` = siguiente · `Shift + ←` = anterior.
- **Cede la radio**: igual que un video o el juego, cuando el
  visualizador suena la Radio NegraLuna se calla; al cerrar la
  ventana vuelve sola (si quedó en ON).
- **Reanuda al regresar**: si cierras la ventana y abres otra pista,
  el visualizador abre de nuevo con el nuevo tema.

## 14 · Comentarios por sección (videos · música · podcast)

Cada sección de video, música o podcast tiene ahora su **propio hilo
de comentarios** al pie del panel. Esto es distinto al muro general
del nodo Comentarios: cada hilo vive en su propio contexto.

- **Contextos:** `proyectos/negra-luna/musica`,
  `proyectos/luna-errante/videos`, `podcast/orbita-lunar/audio`,
  `podcast/orbita-lunar/video`… un hilo por carpeta de contenido.
- **Publicación con servidor:** el botón *Publicar* guarda por la
  API `/api/comentarios?context=…` y aparece al instante. Sin
  servidor, los botones de WhatsApp o correo envían el comentario
  pre-escrito, igual que en el muro.
- **Almacenamiento:** los comentarios viven en
  `comentarios-estado.json` (al lado de `contenido/`), dentro de la
  llave `por_contexto`. Hasta 200 por contexto, 40 caracteres para
  el nombre y 600 para el texto.
- **Sin servidor:** si la página se abre sin `iniciar-servidor`, el
  visitante aún puede dejar su comentario por WhatsApp o correo, y
  tú lo agregas a mano al archivo `contenido/blog/comentarios.txt`
  (el muro general) o lo siembras en la carpeta del proyecto.

## 15 · Videos por enlace de YouTube (almacenamiento externo)

Para que la web no pese gigas, los videos **no viven en tu servidor**:
los subes a YouTube y pegas el enlace en un `.txt`. La página los
incrusta igual que un reproductor nativo, pero se sirven desde
YouTube — no gastan espacio ni ancho de banda de tu hosting, y se
ven rápido desde cualquier país (Chile, España, México…).

### Dónde poner los enlaces

Cada nodo de videos tiene su archivo `videos.txt`:

- `contenido/proyectos/negra-luna/videos/videos.txt`
- `contenido/proyectos/luna-errante/videos/videos.txt`
- `contenido/proyectos/negra-cumbia/videos/videos.txt`
- `contenido/proyectos/simple-mortal/videos/videos.txt`
- `contenido/proyectos/luna-errante/discotopia/videos/videos.txt`

Para el podcast de video, en cambio:

- `contenido/podcast/orbita-lunar/video/capitulos.txt`

### Formato de una línea

```
Título del video | https://www.youtube.com/watch?v=XXXXXXXXXXX
```

También puedes usar los formatos cortos:
- `https://youtu.be/XXXXXXXXXXX`
- `https://www.youtube.com/shorts/XXXXXXXXXXX` (videos verticales)
- `https://www.youtube.com/live/XXXXXXXXXXX` (transmisiones en vivo)

El ID de YouTube siempre son 11 caracteres (letras, números, guiones).

Para el podcast, puedes agregar una descripción tras el segundo `|`:
```
https://www.youtube.com/watch?v=XXXXXXXXXXX | Capítulo 1 · Despegue | De qué va esta órbita
```

### Lo que pesa tu web

Sin videos: 3.4 MB. Con 50 videos en YouTube: 3.4 MB (los videos no
viven en tu web — se cargan desde YouTube cuando alguien los ve).
Tu hosting no sufre, tu web carga en 1-2 segundos.

### Si de verdad quieres MP4 locales

Si tienes un video corto (<50 MB) que no quieres en YouTube, también
puedes copiarlo en la carpeta `videos/` y la web lo lee igual. Pero
para videos largos, mejor YouTube.

## 16 · Cómo subir la web a internet (Render.com, gratis)

Tu `servir.py` funciona en [Render](https://render.com) tal cual. No
tocas código. Pasos:

1. Crea cuenta gratis en [github.com](https://github.com).
2. Descarga [GitHub Desktop](https://desktop.github.com/), inicia
   sesión, crea un repo nuevo y arrastra la carpeta `negraluna`
   completa (la que contiene `servir.py`, `contenido/`, `assets/`).
3. En [render.com](https://render.com) (regístrate con tu GitHub):
   **New + → Web Service → conéctalo a tu repo**.
4. Configura:
   - **Build Command:** `pip install --no-cache-dir`
   - **Start Command:** `python servir.py --port $PORT --no-open`
   - **Plan:** Free
5. Deploy. En 2-3 minutos tienes `https://tu-nombre.onrender.com`.

**Detalles importantes:**

- En Render free el servicio "se duerme" si no recibe visitas en
  15 min. La primera visita después de dormir tarda ~30 s en
  despertar. Si quieres evitarlo gratis, usa
  [uptimerobot.com](https://uptimerobot.com) para que pinguee tu
  URL cada 14 minutos.
- Render free te da 512 MB de disco. Suficiente para la web + tus
  discos en MP3 (no para videos — esos van en YouTube).
- Los comentarios y visitas se guardan en JSON local. En Render
  free, **si el servicio se reinicia se pierden los cambios desde el
  último deploy** — para persistencia real necesitas Render pago
  (USD 7/mes) o conectar un disco persistente.

**Si quieres que los comentarios no se pierdan nunca** sin pagar,
puedes migrarlos a un servicio gratis como [Supabase](https://supabase.com)
— pero eso sí requiere un cambio de código. Lo puedes hacer más
adelante, cuando lo necesites.
