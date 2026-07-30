# Deployment

## Scheduler de GitHub Actions (`.github/workflows/scheduler.yml`)

Dos cron jobs contra el deploy público de la app:

- **flush-mailer** (`*/5 * * * *`): drena `emails_outbox` (Tanda 4) vía
  `POST /api/mailer/flush`.
- **expiring-trials** (`0 8 * * *`, ajustable): invoca
  `GET /api/webhooks/expiring-trials` (heredado de n8n, hoy sin otro
  invocador).

Este workflow **solo hace algo útil cuando la app tenga deploy público**.
Mientras corra solo en `localhost`, ambos jobs fallan con
`Connection refused` — es el comportamiento esperado, no un bug del YAML.

### Secretos requeridos

Configúralos en **Settings → Secrets and variables → Actions** del repo:

| Secreto | Valor |
| --- | --- |
| `APP_BASE_URL` | URL pública del deploy, **sin barra final** (ej. `https://mypersonaltrainer.onrender.com`) |
| `CRON_WEBHOOK_TOKEN` | El mismo valor que `CRON_WEBHOOK_TOKEN` en el `.env` del server — si no coinciden, ambos endpoints responden 401 |

### Verificación manual

Pestaña **Actions** del repo → workflow "Cron scheduler" → **Run workflow**
(`workflow_dispatch`). Ambos jobs corren sin importar el cron que los
disparó normalmente. Deben terminar en verde (`exit 0`) una vez haya deploy
público con los secretos configurados; antes de eso, fallar con
`Connection refused` confirma que el YAML es válido y los secretos están
enlazados — solo falta el deploy.

### Notas operativas

- **Granularidad real ≈ 5 min.** GitHub Actions acepta `cron: "*/1 * * * *"`
  en la sintaxis, pero no garantiza precisión por debajo de ~5 minutos.
- **Los cron jobs pueden retrasarse** varios minutos bajo alta carga de GHA.
  Aceptable para `flush-mailer`: el backoff exponencial del outbox ya
  empieza en 1 minuto, así que 5-10 min extra de un runner ocupado no
  cambian el SLA humano percibido.
- **Los workflows programados se pausan automáticamente** si el repo no
  tiene actividad en 60 días. Para mantenerlos vivos, cualquier push a
  `main` reinicia el contador — no hace falta ninguna acción especial
  mientras el repo siga recibiendo commits con cierta regularidad.
- `-fsS` en cada `curl`: `-f` hace que falle (exit code > 0) ante cualquier
  respuesta HTTP de error en vez de imprimir el body de error como si fuera
  éxito; `-s` silencia la barra de progreso; `-S` fuerza que el mensaje de
  error se muestre igual pese a `-s`. Un job fallido dispara el email
  automático de GitHub al maintainer — es la alerta, no hace falta montar
  nada aparte.
