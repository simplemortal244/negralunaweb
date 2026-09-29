# Cómo subir NegraLuna a internet gratis (Render.com)

> Tiempo total: 15 minutos · Costo: $0

Esta guía te lleva paso a paso. La web queda pública en
`https://tu-nombre.onrender.com` con dominio propio opcional.

---

## PASO 1 · Crear cuenta en GitHub (3 min)

1. Entra a https://github.com/signup
2. Crea cuenta con tu correo
3. Confirma el correo (revisa spam si no te llega)

## PASO 2 · Instalar GitHub Desktop (3 min)

1. Entra a https://desktop.github.com/
2. Descarga e instala
3. Ábrelo, inicia sesión con tu cuenta de GitHub

## PASO 3 · Crear un repositorio y subir tu web (4 min)

1. En GitHub Desktop, botón superior izquierdo: **File → New repository**
2. Nombre: `negraluna-homestudio`
3. Local path: elige la carpeta donde descomprimiste el zip (la que contiene `servir.py`)
4. Marca "Initialize with README"
5. Botón azul **Create repository**
6. Botón **Publish repository** (que quede **desmarcado** "Keep this code private" si quieres que sea público — Render free funciona con repos públicos)
7. Espera 30 segundos a que se suban los archivos

## PASO 4 · Crear cuenta en Render (2 min)

1. Entra a https://render.com/signup
2. Regístrate con GitHub (botón "Sign up with GitHub")
3. Autoriza a Render a acceder a tus repos

## PASO 5 · Crear el servicio web (3 min)

1. En tu dashboard de Render: botón **New + → Web Service**
2. Busca tu repo `negraluna-homestudio` y dale **Connect**
3. Configura:
   - **Name:** `negraluna-homestudio` (lo que quieras; este será el subdominio)
   - **Runtime:** Python 3 (Render lo detecta solo con el `render.yaml`)
   - **Build Command:** `pip install --no-cache-dir`
   - **Start Command:** `python servir.py --port $PORT --no-open`
   - **Instance Type:** Free
4. Botón azul **Create Web Service**
5. Espera 2-3 minutos. Verás logs mientras se construye.
6. Cuando termine, verás algo así:

   ```
   ✔ Live
   https://negraluna-homestudio.onrender.com
   ```

¡Listo! Tu web está pública.

---

## Detalles importantes

### El servicio "se duerme"
En Render free, si la web no recibe visitas por 15 minutos, se
duerme. La primera visita después tarda ~30 segundos en despertar
(Render está arrancando el servidor Python otra vez). No es un error,
solo ten paciencia en esa primera visita del día.

Si quieres evitarlo sin pagar, usa https://uptimerobot.com (gratis):
1. Regístrate
2. Crea un "HTTP monitor" con tu URL de Render
3. Configúralo para hacer ping cada 14 minutos
4. Render nunca dormirá

### Lo que se pierde al reiniciar
Render free **reinicia el servicio cada vez que haces deploy** (o si
el servidor se cae). Los comentarios y visitas guardados en los
JSON locales se pierden al reiniciar.

Para que NO se pierdan, dos opciones:
1. **Render pago (USD 7/mes):** el disco es persistente, los JSON
   sobreviven reinicios.
2. **Migrar comentarios a Supabase (gratis):** hay que tocar el
   código. Lo puedes hacer después, no es urgente.

### Subir dominio propio
Si tienes `negraluna.cl`:
1. En Render: **Settings → Custom Domains → Add Custom Domain**
2. Render te da un registro DNS (un CNAME)
3. Vas a tu proveedor de dominio (NIC Chile, GoDaddy, etc.)
4. Agrega el CNAME que Render te dio
5. Espera 24 horas y tu web queda en https://negraluna.cl

### Actualizar la web (cuando cambies algo)
1. En tu PC, editas archivos (audios, videos.txt, lo que sea)
2. GitHub Desktop: verás los cambios abajo
3. Escribe un mensaje corto arriba ("nuevas fotos")
4. Botón **Commit to main**
5. Botón **Push origin**
6. Render detecta el cambio y redeploya solo en 2-3 minutos

---

## ¿Problemas?

### "Render says my service failed to start"
Revisa los logs en Render → tu servicio → pestaña "Logs". Si dice
algo de Python no encontrado, asegúrate de que el `runtime: python`
está en tu `render.yaml`.

### "Mi web carga pero se ve en blanco"
Abre la consola del navegador (F12 → Console). Si dice algo de CORS
o mixed content, probablemente es porque abriste un enlace con
`http://` desde un `https://`. Tu web en Render es `https://`, así
que los enlaces externos también deben ser `https://` (YouTube lo es).

### "Mi video de YouTube no se ve"
Revisa que el ID del video tenga exactamente 11 caracteres. Si
pegaste un enlace raro como `youtube.com/watch?v=abc&feature=share`,
no funciona — usa el enlace limpio `youtube.com/watch?v=abc` o el
corto `youtu.be/abc`.

### "Se cayó toda la web, ¡socorro!"
Render free reinicia el servicio cada 750 horas/mes. Si recibes
millones de visitas, se acaba. Para tu caso no va a pasar — pero si
sí, pásate al plan pago (USD 7/mes) y ya.
