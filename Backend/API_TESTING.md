# AgriSmart Backend — API Reference & Testing Guide

> **Base URL (dev):** `http://127.0.0.1:8000`  
> **WebSocket (dev):** `ws://127.0.0.1:8000/ws/dashboard/?token=<access_token>`

---

## 1. Prerequisites

### Start the stack

docker run -d --name agrismart-redis -p 6379:6379 redis:7-alpine

```bash
# 1 — Redis (Docker)
docker start agrismart-redis       # or: docker run -d --name agrismart-redis -p 6379:6379 redis:7-alpine

# 2 — Django ASGI server (WebSocket support)
cd Backend
.\venv\Scripts\Activate.ps1        # Windows PowerShell
daphne -b 127.0.0.1 -p 8000 config.asgi:application

# 3 — React dev server (separate terminal)
cd Frontend/frontend
npm run dev
```

### Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` (local Docker) |
| `API_KEY_ESP32` | Static key for ESP32 / IoT endpoint |
| `ACCESS_TOKEN_LIFETIME_MINUTES` | Default: 15 |
| `REFRESH_TOKEN_LIFETIME_DAYS` | Default: 7 |

---

## 2. Authentication

### Schemes

| Scheme | How to send |
|---|---|
| **JWT** | `Authorization: Bearer <access_token>` |
| **API Key** | `X-Api-Key: <API_KEY_ESP32>` |
| **Cookie** | `refresh_token` HTTP-only cookie (set automatically by login) |

### Token lifecycle

1. **Login** → receive `access_token` in body + `refresh_token` cookie
2. Use `access_token` in `Authorization` header for every protected request
3. When `access_token` expires (401), call **Token Refresh** → new `access_token`
4. **Logout** revokes the session; all tokens become invalid immediately

---

## 3. REST Endpoints

### 3.1 Authentication — `/api/auth/`

---

#### POST `/api/auth/login/`

No authentication required. Rate-limited to **5 req/min per IP**.

**Request**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response 200**
```json
{
  "access_token": "eyJ...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "language": "fr"
  }
}
```
`refresh_token` is set as an HTTP-only cookie.

**cURL**
```bash
curl -c cookies.txt -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

---

#### POST `/api/auth/logout/`

Requires JWT authentication.

**Request body:** none

**Response 200**
```json
{ "detail": "Logged out." }
```

**cURL**
```bash
curl -b cookies.txt -X POST http://127.0.0.1:8000/api/auth/logout/ \
  -H "Authorization: Bearer <access_token>"
```

---

#### POST `/api/auth/token/refresh/`

No authentication required. Reads `refresh_token` from the HTTP-only cookie.

**Request body:** none

**Response 200**
```json
{ "access_token": "eyJ..." }
```
A new `refresh_token` cookie is also set (rotation).

**cURL**
```bash
curl -b cookies.txt -c cookies.txt -X POST http://127.0.0.1:8000/api/auth/token/refresh/
```

---

### 3.2 Users — `/api/users/`

All endpoints require **admin** role.

---

#### GET `/api/users/`

**Response 200**
```json
[
  {
    "id": "uuid",
    "username": "alice",
    "email": "alice@example.com",
    "role": "viewer",
    "language": "fr",
    "is_active": true,
    "created_by_username": "admin",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**cURL**
```bash
curl http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer <access_token>"
```

---

#### POST `/api/users/`

**Request**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "securepass123",
  "role": "viewer",
  "language": "fr"
}
```

`role` choices: `admin` | `viewer`  
`language` choices: `fr` | `en`

**Response 201** — same shape as list item

**cURL**
```bash
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"securepass123","role":"viewer","language":"fr"}'
```

---

#### GET `/api/users/<user_id>/`

**Response 200** — same shape as list item

---

#### PATCH `/api/users/<user_id>/`

Cannot deactivate your own account.

**Request** (all fields optional)
```json
{
  "role": "admin",
  "language": "en",
  "is_active": false
}
```

**Response 200** — same shape as list item

**cURL**
```bash
curl -X PATCH http://127.0.0.1:8000/api/users/<user_id>/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

---

#### POST `/api/users/<user_id>/reset-password/`

**Request**
```json
{ "new_password": "newpassword123" }
```

**Response 200**
```json
{ "detail": "Password reset." }
```

---

### 3.3 Sensors — `/api/sensors/`

---

#### GET `/api/sensors/`

Requires authentication (any role).

**Response 200**
```json
[
  {
    "id": "uuid",
    "name": "Soil Moisture 1",
    "type": "humidity",
    "unit": "%",
    "location": "Zone A",
    "is_active": true,
    "created_at": "...",
    "latest_value": 42.5,
    "latest_read_at": "...",
    "last_status": "ok"
  }
]
```

**cURL**
```bash
curl http://127.0.0.1:8000/api/sensors/ \
  -H "Authorization: Bearer <access_token>"
```

---

#### PATCH `/api/sensors/<sensor_id>/`

Requires **admin** role.

**Request**
```json
{ "is_active": false }
```

**Response 200** — same shape as list item

---

#### GET `/api/sensors/<sensor_id>/readings/`

Requires authentication. Returns up to **500 readings**.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `from` | ISO datetime | Start of range |
| `to` | ISO datetime | End of range |

**Response 200**
```json
[
  {
    "id": "uuid",
    "sensor_id": "uuid",
    "sensor_name": "Soil Moisture 1",
    "sensor_type": "humidity",
    "sensor_unit": "%",
    "value": "42.5000",
    "measured_at": "2024-01-01T10:00:00Z"
  }
]
```

**cURL**
```bash
curl "http://127.0.0.1:8000/api/sensors/<sensor_id>/readings/?from=2024-01-01T00:00:00Z&to=2024-01-02T00:00:00Z" \
  -H "Authorization: Bearer <access_token>"
```

---

#### GET `/api/sensors/<sensor_id>/latest/`

**Response 200** — single reading object (same shape as above), or `404` if no readings

---

### 3.4 Thresholds — `/api/thresholds/`

---

#### GET `/api/thresholds/`

Requires authentication.

**Response 200**
```json
[
  {
    "id": "uuid",
    "sensor_type": "temperature",
    "min_value": "10.0000",
    "max_value": "35.0000",
    "set_by_username": "admin",
    "updated_at": "..."
  }
]
```

---

#### PATCH `/api/thresholds/<sensor_type>/`

Requires **admin** role. `<sensor_type>` is the string key (e.g. `temperature`, `humidity`).

`min_value` must be strictly less than `max_value`.

**Request** (all fields optional)
```json
{
  "min_value": "15.0000",
  "max_value": "30.0000"
}
```

**Response 200** — same shape as list item

**cURL**
```bash
curl -X PATCH http://127.0.0.1:8000/api/thresholds/temperature/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"min_value":"15.0000","max_value":"30.0000"}'
```

---

### 3.5 Actuators — `/api/actuators/`

---

#### GET `/api/actuators/`

Requires authentication.

**Response 200**
```json
[
  {
    "id": "uuid",
    "name": "Water Pump",
    "type": "pump",
    "status": "off",
    "last_triggered_at": null,
    "created_at": "..."
  }
]
```

---

#### POST `/api/actuators/<actuator_id>/action/`

Requires **admin** role. Broadcasts `actuator.updated` over WebSocket.

**Request**
```json
{
  "action_type": "on",
  "notes": "Manual activation for irrigation"
}
```

`action_type` choices depend on `Action.Type` model choices (e.g. `on`, `off`).

**Response 201**
```json
{
  "action": {
    "id": "uuid",
    "actuator_id": "uuid",
    "actuator_name": "Water Pump",
    "actuator_type": "pump",
    "triggered_by_username": "admin",
    "action_type": "on",
    "source": "manual",
    "notes": "Manual activation",
    "triggered_at": "..."
  },
  "actuator": { ... }
}
```

**cURL**
```bash
curl -X POST http://127.0.0.1:8000/api/actuators/<actuator_id>/action/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"action_type":"on","notes":""}'
```

---

### 3.6 Alerts — `/api/alerts/`

---

#### GET `/api/alerts/`

Requires authentication.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `severity` | string | Filter by severity level |
| `acknowledged` | `true` \| `false` | Filter by acknowledgement status |
| `from` | ISO datetime | Start of range |
| `to` | ISO datetime | End of range |

**Response 200**
```json
[
  {
    "id": "uuid",
    "type": "threshold_exceeded",
    "message": "Temperature above maximum threshold",
    "severity": "high",
    "is_acknowledged": false,
    "triggered_at": "...",
    "acknowledged_at": null,
    "acknowledged_by_username": null,
    "sensor_name": "Temp Sensor 1",
    "sensor_type": "temperature",
    "sensor_location": "Zone A",
    "actuator_name": null,
    "actuator_type": null
  }
]
```

**cURL**
```bash
curl "http://127.0.0.1:8000/api/alerts/?acknowledged=false&severity=high" \
  -H "Authorization: Bearer <access_token>"
```

---

#### POST `/api/alerts/<alert_id>/acknowledge/`

Requires **admin** role. Broadcasts `alert.acknowledged` over WebSocket.

**Request body:** none

**Response 200** — same shape as list item with `is_acknowledged: true`

**cURL**
```bash
curl -X POST http://127.0.0.1:8000/api/alerts/<alert_id>/acknowledge/ \
  -H "Authorization: Bearer <access_token>"
```

---

### 3.7 Script Logs — `/api/script-logs/`

---

#### GET `/api/script-logs/`

Requires **admin** role.

**Query parameters:** `from`, `to` (ISO datetimes)

**Response 200**
```json
[
  {
    "id": "uuid",
    "executed_by_username": "admin",
    "command": "python manage.py collectstatic",
    "result": "exit 0",
    "source": "cli",
    "executed_at": "..."
  }
]
```

---

#### POST `/api/script-logs/`

Requires `X-Api-Key` header (ESP32 API key — no JWT needed).

**Request**
```json
{
  "command": "sensor_init",
  "result": "ok",
  "source": "esp32",
  "executed_by": "uuid-of-user-optional"
}
```

`source` choices: `cli` | `esp32` (check `ScriptLog.Source.choices` in models)

**Response 201** — same shape as list item

**cURL**
```bash
curl -X POST http://127.0.0.1:8000/api/script-logs/ \
  -H "X-Api-Key: <API_KEY_ESP32>" \
  -H "Content-Type: application/json" \
  -d '{"command":"sensor_init","result":"ok","source":"esp32"}'
```

---

### 3.8 Exports — `/api/exports/`

---

#### GET `/api/exports/`

Requires authentication. Returns the history of past exports.

**Response 200**
```json
[
  {
    "id": "uuid",
    "exported_by_username": "admin",
    "export_type": "sensor_readings",
    "filters": {"sensor_id": "uuid"},
    "file_path": null,
    "created_at": "..."
  }
]
```

---

#### POST `/api/exports/`

Requires authentication. Returns a **streamed CSV file** directly.

**Request**
```json
{
  "export_type": "sensor_readings",
  "from_date": "2024-01-01T00:00:00Z",
  "to_date":   "2024-01-31T23:59:59Z",
  "sensor_id": "uuid-optional",
  "sensor_type": "temperature",
  "severity": "high"
}
```

`export_type` choices: from `Export.Type` model choices (e.g. `sensor_readings`, `alerts`).  
`from_date` must be before `to_date` when both are provided.

**Response 200** — `Content-Type: text/csv`, `Content-Disposition: attachment; filename="agrismart_<export_type>.csv"`

**cURL**
```bash
curl -X POST http://127.0.0.1:8000/api/exports/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"export_type":"sensor_readings","from_date":"2024-01-01T00:00:00Z","to_date":"2024-01-31T23:59:59Z"}' \
  -o export.csv
```

---

### 3.9 IoT Readings — `/api/iot/`

---

#### POST `/api/iot/readings/`

Requires `X-Api-Key` header. Broadcasts `sensor.reading` (and any triggered `alert.new`) over WebSocket.

**Request**
```json
{
  "readings": [
    { "sensor_id": "uuid", "value": "23.5000" },
    { "sensor_id": "uuid", "value": "67.2000" }
  ]
}
```

At least one item required.

**Response 201**
```json
{ "ingested": 2 }
```

**cURL**
```bash
curl -X POST http://127.0.0.1:8000/api/iot/readings/ \
  -H "X-Api-Key: <API_KEY_ESP32>" \
  -H "Content-Type: application/json" \
  -d '{"readings":[{"sensor_id":"<uuid>","value":"23.5"}]}'
```

---

## 4. WebSocket

### Connect

```
ws://127.0.0.1:8000/ws/dashboard/?token=<access_token>
```

Token is passed as a query parameter (browsers cannot send custom headers after the HTTP→WS upgrade).

### Close codes

| Code | Reason |
|---|---|
| `4001` | No authenticated user (missing or invalid token) |
| `4002` | Channel layer unavailable (Redis down) |

### First message on connect

```json
{
  "type": "connection.established",
  "user_id": "uuid",
  "role": "admin"
}
```

### Broadcast events received

All authenticated clients in the `dashboard` group receive these events:

**`sensor.reading`**
```json
{
  "type": "sensor.reading",
  "sensor_id": "uuid",
  "value": "23.5000",
  "measured_at": "...",
  "unit": "%"
}
```

**`alert.new`**
```json
{
  "type": "alert.new",
  "alert_id": "uuid",
  "alert_type": "threshold_exceeded",
  "severity": "high",
  "message": "Temperature above maximum threshold",
  "sensor_name": "Temp Sensor 1",
  "actuator_name": null,
  "triggered_at": "..."
}
```

**`alert.acknowledged`**
```json
{
  "type": "alert.acknowledged",
  "alert_id": "uuid",
  "acknowledged_by": "admin",
  "acknowledged_at": "..."
}
```

**`actuator.updated`**
```json
{
  "type": "actuator.updated",
  "actuator_id": "uuid",
  "status": "on",
  "last_triggered_at": "..."
}
```

**`sensor.status`**
```json
{
  "type": "sensor.status",
  "sensor_id": "uuid",
  "status": "offline",
  "reason": "no reading in 5 minutes"
}
```

### Test WebSocket manually (browser console)

```js
// 1. Login first and copy the access_token from the response
const token = "<access_token>";
const ws = new WebSocket(`ws://127.0.0.1:8000/ws/dashboard/?token=${token}`);
ws.onopen = () => console.log("connected");
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.onclose = (e) => console.log("closed", e.code);
```

### Test WebSocket from Python (requires `websockets` package)

```python
# pip install websockets
import asyncio, json, websockets

TOKEN = "<access_token>"

async def main():
    url = f"ws://127.0.0.1:8000/ws/dashboard/?token={TOKEN}"
    async with websockets.connect(url) as ws:
        msg = await ws.recv()
        print(json.loads(msg))   # connection.established
        await asyncio.sleep(60)  # keep open to see broadcasts

asyncio.run(main())
```

---

## 5. Full Test Sequence (manual)

Run these in order using a single `curl` session with the cookie jar.

```bash
# ── Step 1: Login ─────────────────────────────────────────────────────────────
curl -sc cookies.txt -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' | python -m json.tool
# → copy access_token
TOKEN="<paste access_token here>"

# ── Step 2: Get sensors ────────────────────────────────────────────────────────
curl http://127.0.0.1:8000/api/sensors/ -H "Authorization: Bearer $TOKEN"

# ── Step 3: Get latest reading for a sensor ───────────────────────────────────
SENSOR_ID="<paste sensor uuid>"
curl http://127.0.0.1:8000/api/sensors/$SENSOR_ID/latest/ -H "Authorization: Bearer $TOKEN"

# ── Step 4: Get all thresholds ─────────────────────────────────────────────────
curl http://127.0.0.1:8000/api/thresholds/ -H "Authorization: Bearer $TOKEN"

# ── Step 5: Update a threshold ─────────────────────────────────────────────────
curl -X PATCH http://127.0.0.1:8000/api/thresholds/temperature/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"min_value":"10","max_value":"40"}'

# ── Step 6: List actuators ────────────────────────────────────────────────────
curl http://127.0.0.1:8000/api/actuators/ -H "Authorization: Bearer $TOKEN"

# ── Step 7: Toggle actuator ───────────────────────────────────────────────────
ACTUATOR_ID="<paste actuator uuid>"
curl -X POST http://127.0.0.1:8000/api/actuators/$ACTUATOR_ID/action/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action_type":"on","notes":"test"}'

# ── Step 8: Post a fake IoT reading ──────────────────────────────────────────
curl -X POST http://127.0.0.1:8000/api/iot/readings/ \
  -H "X-Api-Key: <API_KEY_ESP32>" \
  -H "Content-Type: application/json" \
  -d "{\"readings\":[{\"sensor_id\":\"$SENSOR_ID\",\"value\":\"99.0\"}]}"
# → if 99.0 exceeds a threshold, an alert.new event fires on WebSocket

# ── Step 9: List alerts ───────────────────────────────────────────────────────
curl "http://127.0.0.1:8000/api/alerts/?acknowledged=false" -H "Authorization: Bearer $TOKEN"

# ── Step 10: Acknowledge an alert ─────────────────────────────────────────────
ALERT_ID="<paste alert uuid>"
curl -X POST http://127.0.0.1:8000/api/alerts/$ALERT_ID/acknowledge/ \
  -H "Authorization: Bearer $TOKEN"

# ── Step 11: Create a user ────────────────────────────────────────────────────
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@example.com","password":"pass1234","role":"viewer","language":"en"}'

# ── Step 12: Token refresh ────────────────────────────────────────────────────
curl -sb cookies.txt -c cookies.txt -X POST http://127.0.0.1:8000/api/auth/token/refresh/

# ── Step 13: Logout ───────────────────────────────────────────────────────────
curl -b cookies.txt -X POST http://127.0.0.1:8000/api/auth/logout/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Running Django Checks

```bash
cd Backend
.\venv\Scripts\Activate.ps1

# Check for configuration errors
.\venv\Scripts\python manage.py check

# Check database connectivity
.\venv\Scripts\python manage.py dbshell

# Verify migrations are applied
.\venv\Scripts\python manage.py showmigrations

# Run any pending migrations
.\venv\Scripts\python manage.py migrate

# Verify Redis connectivity
.\venv\Scripts\python -c "
import redis, os
from dotenv import load_dotenv
load_dotenv()
r = redis.from_url(os.getenv('REDIS_URL'))
print('Redis ping:', r.ping())
"
```

---

## 7. Permission Matrix

| Endpoint | Viewer | Admin | API Key |
|---|---|---|---|
| POST /api/auth/login/ | ✓ | ✓ | — |
| POST /api/auth/logout/ | ✓ | ✓ | — |
| POST /api/auth/token/refresh/ | ✓ | ✓ | — |
| GET /api/users/ | ✗ | ✓ | — |
| POST /api/users/ | ✗ | ✓ | — |
| PATCH /api/users/<id>/ | ✗ | ✓ | — |
| POST /api/users/<id>/reset-password/ | ✗ | ✓ | — |
| GET /api/sensors/ | ✓ | ✓ | — |
| PATCH /api/sensors/<id>/ | ✗ | ✓ | — |
| GET /api/sensors/<id>/readings/ | ✓ | ✓ | — |
| GET /api/sensors/<id>/latest/ | ✓ | ✓ | — |
| GET /api/thresholds/ | ✓ | ✓ | — |
| PATCH /api/thresholds/<type>/ | ✗ | ✓ | — |
| GET /api/actuators/ | ✓ | ✓ | — |
| POST /api/actuators/<id>/action/ | ✗ | ✓ | — |
| GET /api/alerts/ | ✓ | ✓ | — |
| POST /api/alerts/<id>/acknowledge/ | ✗ | ✓ | — |
| GET /api/script-logs/ | ✗ | ✓ | — |
| POST /api/script-logs/ | — | — | ✓ |
| GET /api/exports/ | ✓ | ✓ | — |
| POST /api/exports/ | ✓ | ✓ | — |
| POST /api/iot/readings/ | — | — | ✓ |
| ws://…/ws/dashboard/ | ✓ | ✓ | — |
