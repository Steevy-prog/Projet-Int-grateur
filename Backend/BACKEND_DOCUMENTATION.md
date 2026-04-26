# AgriSmart — Backend Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Configuration](#configuration)
5. [Authentication App](#authentication-app)
6. [Users App](#users-app)
7. [Sensors App](#sensors-app)
8. [Actuators App](#actuators-app)
9. [Alerts App](#alerts-app)
10. [Script Logs App](#script-logs-app)
11. [Exports App](#exports-app)
12. [IoT App](#iot-app)
13. [WebSocket Module](#websocket-module)
14. [Database Design Notes](#database-design-notes)
15. [API URL Reference](#api-url-reference)

---

## Architecture Overview

AgriSmart is a Django-based REST API + WebSocket server for an IoT greenhouse management system. It manages 5 sensors and 3 actuators connected via an ESP32 microcontroller.

```
ESP32 ──MQTT──► Mosquitto Broker ──► mqtt_subscriber (management command)
                                              │
                                              ▼
Browser ◄──WebSocket── Daphne (ASGI) ◄── Redis Channel Layer
    │                        │
    │                        ▼
    └──────HTTP──────► Django REST Views ──► PostgreSQL (Neon cloud)
```

There are **two data ingestion paths**:
- **Primary path**: ESP32 → MQTT → `mqtt_subscriber` command → PostgreSQL + WebSocket broadcast
- **Fallback path**: ESP32 (or test scripts) → `POST /api/iot/readings/` → PostgreSQL + WebSocket broadcast

All real-time updates to connected browsers are pushed via WebSocket through a Redis channel layer.

---

## Technology Stack

| Package | Version | Purpose |
|---|---|---|
| Django | ≥ 4.2 | Web framework |
| djangorestframework | ≥ 3.15 | REST API layer |
| daphne | ≥ 4.0 | ASGI server (replaces gunicorn) |
| channels | ≥ 4.0 | WebSocket support via Django Channels |
| channels-redis | ≥ 4.0 | Redis channel layer backend |
| psycopg2-binary | ≥ 2.9 | PostgreSQL driver |
| djangorestframework-simplejwt | ≥ 5.3 | JWT token generation utilities |
| django-cors-headers | ≥ 4.3 | CORS support for the React frontend |
| python-decouple | ≥ 3.8 | Environment variable loading from `.env` |
| django-ratelimit | ≥ 4.0 | Rate limiting on the login endpoint |
| redis | ≥ 5.0 | Redis client (used by channel layer) |
| bcrypt | ≥ 4.0 | Password hashing compatible with PostgreSQL `crypt()` |
| paho-mqtt | ≥ 1.6.1 | MQTT client for consuming ESP32 messages |

---

## Project Structure

```
Backend/
├── manage.py                        # Django management entry point
├── requirements.txt                 # Python dependencies
├── .env                             # Local environment variables (not in git)
├── .env.example                     # Template for .env
│
├── config/                          # Django project configuration
│   ├── asgi.py                      # ASGI entry point (HTTP + WebSocket routing)
│   ├── urls.py                      # Root URL configuration
│   └── settings/
│       ├── base.py                  # Shared settings for all environments
│       ├── development.py           # Dev overrides (DEBUG=True, CORS open)
│       └── production.py            # Prod overrides (HTTPS, strict CORS)
│
├── apps/                            # Django applications
│   ├── authentication/              # Login, logout, token refresh
│   ├── users/                       # User CRUD and permissions
│   ├── sensors/                     # Sensor data, readings, thresholds
│   ├── actuators/                   # Actuator control and action history
│   ├── alerts/                      # Alert list and acknowledgement
│   ├── script_logs/                 # CLI/automation execution logs
│   ├── exports/                     # CSV export generation
│   └── iot/                         # ESP32 HTTP ingest + MQTT subscriber
│
└── websocket/                       # Django Channels WebSocket module
    ├── consumers.py                 # WebSocket consumer (DashboardConsumer)
    ├── events.py                    # Shared event type constants
    ├── middleware.py                # JWT auth middleware for WebSocket
    └── routing.py                   # WebSocket URL routing
```

---

## Configuration

### `config/asgi.py`

The ASGI entry point. Routes incoming connections by protocol:
- **HTTP** → standard Django request handling via `get_asgi_application()`
- **WebSocket** → `DashboardConsumer` after passing through `AllowedHostsOriginValidator` and `JWTAuthMiddlewareStack`

The WebSocket path is wrapped with the custom JWT middleware before reaching the URL router, ensuring unauthenticated WebSocket connections are rejected.

### `config/urls.py`

Root URL dispatcher. Maps URL prefixes to each app's `urls.py`:

| Prefix | App |
|---|---|
| `/api/auth/` | authentication |
| `/api/users/` | users |
| `/api/sensors/` | sensors |
| `/api/thresholds/` | sensors (separate urlpatterns) |
| `/api/actuators/` | actuators |
| `/api/alerts/` | alerts |
| `/api/script-logs/` | script_logs |
| `/api/exports/` | exports |
| `/api/iot/` | iot |

### `config/settings/base.py`

Core settings shared across all environments. Key sections:

- **Database**: Single `DATABASE_URL` environment variable, parsed by a custom `_parse_db_url()` helper. Points to Neon PostgreSQL cloud.
- **Channel Layer**: Redis backend, URL from `REDIS_URL` env var. Used by both the WebSocket consumer and any view that broadcasts events.
- **REST_FRAMEWORK**: Sets `JWTAuthentication` as the default authenticator, `IsAuthenticated` as the default permission class, and `custom_exception_handler` for uniform error shapes.
- **SIMPLE_JWT**: Configures access token lifetime (default 15 min) and refresh token lifetime (default 7 days) from env vars. Token rotation is enabled.
- **API_KEY_ESP32**: Static API key for authenticating ESP32 HTTP requests. Read from `.env`.
- **MQTT settings**: Broker host/port, credentials, client ID, and topic prefix — all from `.env`.

### `config/settings/development.py`

Extends `base.py` with:
- `DEBUG = True`
- `ALLOWED_HOSTS` limited to localhost
- Console logging with DEBUG level for the `websocket` logger
- CORS open to `localhost:5173` (Vite dev server), with `CORS_ALLOW_ALL_ORIGINS = True` for easy local testing

### `config/settings/production.py`

Extends `base.py` with:
- `DEBUG = False`
- `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` read from env vars (comma-separated)
- Full HTTPS enforcement: `SECURE_SSL_REDIRECT`, HSTS headers, secure cookies

---

## Authentication App

**Location**: `apps/authentication/`

Handles login, logout, and access token renewal. Uses a **custom JWT implementation** rather than simplejwt's default views — tokens are stored in the database (hashed) so they can be revoked server-side.

### `models.py`

Four models, all `managed = False` (mapped to SQL-managed tables):

| Model | Table | Purpose |
|---|---|---|
| `Session` | `sessions` | One per login. Tracks IP, user agent, and revocation time. |
| `AccessToken` | `access_tokens` | Short-lived JWT. Stored as SHA-256 hash. Has `is_valid` property. |
| `RefreshToken` | `refresh_tokens` | Long-lived token stored in httpOnly cookie. Stored as hash. Has `is_valid` property. |
| `PasswordResetToken` | `password_reset_tokens` | One-time token for admin password resets. Has `is_valid` property. |

### `authentication.py` — `JWTAuthentication`

Custom DRF `BaseAuthentication` class. On every authenticated request:
1. Reads `Authorization: Bearer <token>` header
2. SHA-256 hashes the raw token
3. Looks up the hash in `access_tokens`
4. Validates: not revoked, not expired, session still active, user still active
5. Returns `(user, token)` — makes the access token available as `request.auth`

### `utils.py`

Four utility functions:

| Function | Purpose |
|---|---|
| `hash_token(raw)` | SHA-256 hash for safe DB storage of tokens |
| `verify_password(plain, hash)` | bcrypt check, compatible with PostgreSQL `crypt()` |
| `generate_tokens(user)` | Creates simplejwt access + refresh pair, returns strings + expiry datetimes |
| `set_refresh_cookie(response, token)` | Sets httpOnly, SameSite=Lax cookie (secure=True in production) |
| `clear_refresh_cookie(response)` | Deletes the refresh cookie on logout |

### `serializers.py`

- **`LoginSerializer`**: Validates `email` + `password`, returns authenticated `user` in `validated_data`. Uses identical error messages for wrong email vs wrong password to prevent user enumeration.
- **`UserMeSerializer`**: Serializes `id`, `username`, `email`, `role`, `language` — returned on login.

### `views.py`

| View | Method | Endpoint | Auth Required |
|---|---|---|---|
| `LoginView` | POST | `/api/auth/login/` | No |
| `LogoutView` | POST | `/api/auth/logout/` | Yes |
| `TokenRefreshView` | POST | `/api/auth/token/refresh/` | No |

**`LoginView`**: Rate-limited to 5 requests/minute per IP. On success, creates a `Session`, generates an access+refresh token pair, persists both as hashes, returns the access token in the response body and sets the refresh token as an httpOnly cookie.

**`LogoutView`**: Revokes all `AccessToken` and `RefreshToken` rows for the current session, marks the session as revoked, and clears the refresh cookie.

**`TokenRefreshView`**: Reads the refresh token from the httpOnly cookie. Validates it, then **rotates**: revokes the old refresh token + all active access tokens in the session, and issues a fresh token pair. Implements the token rotation security pattern.

### `exceptions.py`

Global DRF exception handler (`custom_exception_handler`). Wraps all error responses into a consistent shape:
```json
{ "error": 400, "detail": "Descriptive message here." }
```

---

## Users App

**Location**: `apps/users/`

### `models.py` — `User`

Custom user model (`managed = False`, table `users`). Does **not** extend `AbstractUser` — it's a plain `models.Model` with manual `is_authenticated` and `is_anonymous` properties so DRF permission classes work correctly.

Fields: `id` (UUID), `username`, `email`, `password_hash`, `role` (admin/viewer), `language` (fr/en), `is_active`, `created_by` (FK to self), `created_at`, `updated_at` (managed by DB trigger).

### `permissions.py` — `IsAdmin`

Custom DRF `BasePermission`. Grants access only when `request.user.role == 'admin'` and `request.user.is_active`. Used by any admin-only endpoint across all apps.

### `serializers.py`

| Serializer | Purpose |
|---|---|
| `UserListSerializer` | Safe read-only output. Never exposes `password_hash`. Includes `created_by_username`. |
| `UserCreateSerializer` | Validates uniqueness of username/email, hashes password with bcrypt, sets `created_by` from request context. |
| `UserPatchSerializer` | Admin can update `role`, `language`, `is_active` only. |
| `PasswordResetSerializer` | Validates `new_password` (min 8 chars). |

### `views.py`

| View | Methods | Endpoint | Permission |
|---|---|---|---|
| `UserListCreateView` | GET, POST | `/api/users/` | IsAdmin |
| `UserDetailView` | GET, PATCH | `/api/users/<id>/` | IsAdmin |
| `PasswordResetView` | POST | `/api/users/<id>/reset-password/` | IsAdmin |

**`UserDetailView.patch`**: Prevents an admin from deactivating their own account (guard against lockout).

**`PasswordResetView`**: Hashes the new password with bcrypt and saves it directly to `password_hash`. No email flow — designed for direct admin-controlled resets.

---

## Sensors App

**Location**: `apps/sensors/`

### `models.py`

| Model | Table | Purpose |
|---|---|---|
| `Sensor` | `sensors` | Sensor registry (name, type, unit, location, active status) |
| `SensorReading` | `sensor_readings` | Individual timestamped measurement from a sensor |
| `SensorStatusLog` | `sensor_status_logs` | History of online/offline/error transitions (written by DB trigger) |
| `Threshold` | `thresholds` | Min/max alert thresholds per sensor type |

**`Sensor.Type`** choices: `humidity`, `temperature`, `co2`, `luminosity`, `water_level`

**`Threshold.set_by`** has `db_column='set_by'` because the PostgreSQL column name does not use Django's default `_id` suffix.

### `serializers.py`

| Serializer | Purpose |
|---|---|
| `SensorSerializer` | Full sensor output including `latest_value`, `latest_read_at`, `last_status` (from `@property` on the model or annotated queries) |
| `SensorReadingSerializer` | Individual reading: `id`, `sensor_id`, `value`, `measured_at` |
| `ThresholdSerializer` | Full threshold output including `set_by_username` |
| `ThresholdPatchSerializer` | Validates `min_value` / `max_value` update, sets `set_by` from request context |

### `views.py`

| View | Methods | Endpoint | Permission |
|---|---|---|---|
| `SensorListView` | GET | `/api/sensors/` | IsAuthenticated |
| `SensorDetailView` | PATCH | `/api/sensors/<id>/` | IsAdmin |
| `SensorReadingsView` | GET | `/api/sensors/<id>/readings/` | IsAuthenticated |
| `SensorLatestView` | GET | `/api/sensors/<id>/latest/` | IsAuthenticated |
| `ThresholdListView` | GET | `/api/thresholds/` | IsAuthenticated |
| `ThresholdDetailView` | PATCH | `/api/thresholds/<sensor_type>/` | IsAdmin |

**`SensorListView`**: Prefetches `readings` and `status_logs` relations to compute `latest_value`, `latest_read_at`, and `last_status` without N+1 queries.

**`SensorReadingsView`**: Supports `?from=` and `?to=` datetime filters. Capped at **500 readings** per request to prevent oversized payloads.

**`ThresholdDetailView`**: Updates `min_value` and/or `max_value`. The `set_by` FK is automatically set to the requesting admin.

---

## Actuators App

**Location**: `apps/actuators/`

### `models.py`

| Model | Table | Purpose |
|---|---|---|
| `Actuator` | `actuators` | Actuator registry (name, type, current status) |
| `Action` | `actions` | Every on/off command — who triggered it, from where, when |

**`Actuator.Type`** choices: `pump`, `ventilation`, `lighting`

**`Actuator.status`** (`on`/`off`) and `last_triggered_at` are **updated by a PostgreSQL DB trigger** (`trg_actuator_on_action`) when an `Action` row is inserted — Django calls `actuator.refresh_from_db()` after the insert to read the updated values.

**`Action.triggered_by`** has `db_column='triggered_by'` because the PostgreSQL column name omits the `_id` suffix.

### `serializers.py`

| Serializer | Purpose |
|---|---|
| `ActuatorSerializer` | Output for actuator state: `id`, `name`, `type`, `status`, `last_triggered_at` |
| `ActionSerializer` | Full action log row, includes `actuator_name`, `actuator_type`, `triggered_by_username` |
| `TriggerActionSerializer` | Input for triggering an action: `action_type` (turn_on/turn_off) + optional `notes` |

### `views.py`

| View | Methods | Endpoint | Permission |
|---|---|---|---|
| `ActuatorListView` | GET | `/api/actuators/` | IsAuthenticated |
| `ActuatorActionsView` | GET | `/api/actuators/actions/` | IsAuthenticated |
| `ActuatorActionView` | POST | `/api/actuators/<id>/action/` | IsAdmin |

**`ActuatorActionView`**: Creates an `Action` row → DB trigger updates `actuator.status` → `refresh_from_db()` reads new state → broadcasts `actuator.updated` WebSocket event to all connected clients.

**`ActuatorActionsView`**: Lists all action history, newest first. Supports `?from=` and `?to=` datetime filters. Capped at 200 rows.

**`_broadcast_actuator_update`**: Internal helper that sends the `actuator.updated` event to the Redis channel layer, carrying `actuator_id`, `status`, and `last_triggered_at`.

---

## Alerts App

**Location**: `apps/alerts/`

### `models.py` — `Alert`

Table `alerts`. Generated automatically by PostgreSQL DB triggers when sensor readings breach thresholds. Django never creates alerts directly — it only reads and acknowledges them.

Fields: `id`, `sensor` (FK, nullable), `actuator` (FK, nullable), `type`, `message`, `severity` (low/medium/high), `is_acknowledged`, `acknowledged_by` (FK with `db_column='acknowledged_by'`), `triggered_at`, `acknowledged_at`.

**`Alert.Type`** choices include: `low_humidity`, `high_temperature`, `low_temperature`, `high_co2`, `low_water_level`, `low_luminosity`, `sensor_failure`.

### `serializers.py` — `AlertSerializer`

Flat output including denormalized fields: `sensor_name`, `sensor_type`, `sensor_location`, `actuator_name`, `actuator_type`, `acknowledged_by_username`.

### `views.py`

| View | Methods | Endpoint | Permission |
|---|---|---|---|
| `AlertListView` | GET | `/api/alerts/` | IsAuthenticated |
| `AlertAcknowledgeView` | POST | `/api/alerts/<id>/acknowledge/` | IsAdmin |

**`AlertListView`**: Supports query filters: `?severity=`, `?acknowledged=true/false`, `?from=`, `?to=`.

**`AlertAcknowledgeView`**: Sets `is_acknowledged=True`, records `acknowledged_by` and `acknowledged_at`, then broadcasts an `alert.acknowledged` WebSocket event to all connected clients. Returns 400 if already acknowledged.

---

## Script Logs App

**Location**: `apps/script_logs/`

### `models.py` — `ScriptLog`

Table `script_logs`. Records every command executed by CLI scripts or automation. Fields: `id`, `executed_by` (FK with `db_column='executed_by'`), `command`, `result`, `source` (cli/auto), `executed_at`.

### `serializers.py` — `ScriptLogSerializer`

Outputs: `id`, `command`, `result`, `source`, `executed_by_username`, `executed_at`, `script_name` (if present in notes).

### `views.py` — `ScriptLogListView`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/script-logs/` | IsAdmin |

Returns all script logs ordered by most recent. Admin-only — contains internal command execution history.

---

## Exports App

**Location**: `apps/exports/`

Provides server-side CSV generation for sensor readings, actuator actions, and alerts. The browser receives a streaming CSV file directly.

### `models.py` — `Export`

Table `exports`. Tracks every export generated. Fields: `id`, `exported_by` (FK with `db_column='exported_by'`), `export_type`, `filters` (JSONB), `file_path` (nullable — exports are streamed, not saved to disk), `created_at`.

**`Export.Type`** choices: `sensor_readings`, `actions`, `alerts`.

### `serializers.py`

| Serializer | Purpose |
|---|---|
| `ExportSerializer` | Read output for export history list |
| `ExportCreateSerializer` | Input validation: `export_type` (required) + optional filters: `from_date`, `to_date`, `sensor_id`, `sensor_type`, `severity`. Validates that `from_date < to_date`. |

### `csv_builder.py`

Three builder functions, each accepting a `filters` dict and returning a CSV string:

| Function | Data source | Columns |
|---|---|---|
| `build_sensor_readings_csv` | `SensorReading` | id, sensor_name, sensor_type, unit, location, value, measured_at |
| `build_actions_csv` | `Action` | id, actuator_name, actuator_type, action_type, source, triggered_by, notes, triggered_at |
| `build_alerts_csv` | `Alert` | id, type, severity, message, sensor_name, actuator_name, is_acknowledged, acknowledged_by, triggered_at, acknowledged_at |

The `BUILDERS` dict maps `export_type` string → builder function. All builders use `.iterator()` for memory-efficient streaming of large datasets.

### `views.py` — `ExportListCreateView`

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/exports/` | IsAuthenticated |
| POST | `/api/exports/` | IsAuthenticated |

**GET**: Returns the current user's export history.

**POST**: Validates input → selects the right builder → generates CSV string → records the export in DB → returns as `HttpResponse` with `Content-Type: text/csv` and `Content-Disposition: attachment`. The file is streamed directly to the browser — no file is saved on the server.

---

## IoT App

**Location**: `apps/iot/`

Handles data ingestion from the ESP32 hardware via two channels: HTTP (fallback) and MQTT (primary).

### `authentication.py`

Two classes for ESP32 authentication:

**`APIKeyAuthentication`**: Reads the `X-API-Key` header and compares it to `settings.API_KEY_ESP32` using `hmac.compare_digest` (constant-time comparison, prevents timing attacks). Returns `(None, True)` on success — no user object, since the ESP32 is a machine client.

**`HasValidAPIKey`**: DRF permission class that allows access only when `request.auth is True` (set by `APIKeyAuthentication`).

### `serializers.py` — `IoTBatchReadingSerializer`

Validates the ESP32 HTTP payload format:
```json
{
  "readings": [
    { "sensor_type": "temperature", "value": 23.5 },
    { "sensor_type": "humidity",    "value": 68.0 }
  ]
}
```
Each item resolves the `sensor_type` to an active `Sensor` object from the DB.

### `views.py` — `IoTReadingView`

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/iot/readings/` | APIKeyAuthentication + HasValidAPIKey |

**HTTP fallback for manual testing** (primary path is MQTT). Accepts a batch of readings, creates `SensorReading` rows, then calls `_broadcast_readings_and_alerts()` which:
1. Broadcasts a `sensor.reading` WebSocket event for each new reading
2. Queries for any alerts the DB trigger created since ingestion and broadcasts `alert.new` for each

### `handler.py` — `process_message()`

The MQTT message handler, passed as `on_message` to the paho client.

**Topics consumed:**
- `{prefix}/readings/{sensor_type}` — payload: `{"value": <number>}`
- `{prefix}/status/{sensor_type}` — payload: `"online"` | `"offline"` | `"error"`

**`_handle_reading()`**:
1. Parses JSON payload to extract `value`
2. Resolves the active sensor by `sensor_type`
3. Creates a `SensorReading` row
4. Broadcasts `sensor.reading` WebSocket event
5. Queries for DB-trigger-generated alerts since ingestion time and broadcasts `alert.new` for each

**`_handle_status()`**:
1. Validates status string
2. Resolves sensor by `sensor_type`
3. Updates `sensor.is_active` only if the status actually changed (avoids redundant DB writes)
4. Broadcasts `sensor.status` WebSocket event

The `_broadcast()` helper wraps `group_send` in a try/except so a Redis outage never crashes the MQTT subscriber process.

### `mqtt_client.py` — `build_client()`

Builds and connects a paho MQTT client:
- Sets credentials from settings if provided
- Registers `_on_connect` (subscribes to `{prefix}/readings/#` and `{prefix}/status/#` at QoS 1) and `_on_disconnect` (logs unexpected disconnects) callbacks
- Configures exponential back-off reconnect: 2s → 60s
- Returns the connected client (caller must then call `client.loop_forever()`)

### `management/commands/mqtt_subscriber.py` — `Command`

Django management command: `python manage.py mqtt_subscriber`

Starts the blocking MQTT subscriber loop. Should run as a **separate process** alongside Daphne:
```
# Procfile
web:    daphne -b 0.0.0.0 -p $PORT config.asgi:application
worker: python manage.py mqtt_subscriber
```
Handles `SIGTERM` for graceful shutdown (Heroku/Docker/systemd compatible) and `KeyboardInterrupt` for local development.

---

## WebSocket Module

**Location**: `websocket/`

### `events.py`

Single source of truth for all WebSocket event type strings and the group name. Import these constants everywhere instead of using raw strings.

| Constant | Value | Direction |
|---|---|---|
| `DASHBOARD_GROUP` | `'dashboard'` | Group name for `group_add` / `group_send` |
| `SENSOR_READING` | `'sensor.reading'` | Server → clients |
| `ALERT_NEW` | `'alert.new'` | Server → clients |
| `ALERT_ACKNOWLEDGED` | `'alert.acknowledged'` | Server → clients |
| `ACTUATOR_UPDATED` | `'actuator.updated'` | Server → clients |
| `SENSOR_STATUS` | `'sensor.status'` | Server → clients |

### `middleware.py` — `JWTAuthMiddleware`

Channels middleware that authenticates WebSocket connections. Since WebSocket connections cannot send custom headers after the HTTP upgrade, the access token is passed as a **query parameter**:
```
ws://localhost:8000/ws/dashboard/?token=<access_token>
```
The middleware extracts the token, hashes it, looks it up in the `access_tokens` DB table, validates expiry/revocation/session/user status, and sets `scope['user']`. If invalid, `scope['user']` is `None` and the consumer will close the connection with code `4001`.

`JWTAuthMiddlewareStack(inner)` is a convenience wrapper used in `asgi.py`.

### `consumers.py` — `DashboardConsumer`

Async WebSocket consumer (extends `AsyncWebsocketConsumer`). One consumer instance per connected browser tab.

**`connect()`**: Checks `scope['user']`. If `None`, accepts then immediately closes with code `4001`. If authenticated, adds the channel to the `dashboard` group and sends a `connection.established` confirmation message.

**`disconnect()`**: Removes the channel from the `dashboard` group.

**Event handlers** (one per event type — method name = event type with `.` → `_`):

| Handler method | Event type | Payload forwarded to client |
|---|---|---|
| `sensor_reading` | `sensor.reading` | sensor_id, value, measured_at, unit |
| `alert_new` | `alert.new` | alert_id, alert_type, severity, message, sensor_name, actuator_name, triggered_at |
| `alert_acknowledged` | `alert.acknowledged` | alert_id, acknowledged_by, acknowledged_at |
| `actuator_updated` | `actuator.updated` | actuator_id, status, last_triggered_at |
| `sensor_status` | `sensor.status` | sensor_id, status, reason |

Each handler wraps the send in a try/except for `KeyError` to log malformed events without crashing the consumer.

### `routing.py`

WebSocket URL routing:
```python
websocket_urlpatterns = [
    path('ws/dashboard/', DashboardConsumer.as_asgi()),
]
```

---

## Database Design Notes

All Django models use `managed = False` — the PostgreSQL schema is fully managed by the SQL scripts in `Database/sql/`. Django never runs migrations against these tables.

**FK column naming**: PostgreSQL columns that are foreign keys are named without Django's default `_id` suffix (e.g., `triggered_by`, `acknowledged_by`, `exported_by`). All such `ForeignKey` fields in the models therefore specify `db_column='<fieldname>'` to match the actual column name.

**DB triggers do the heavy lifting**:
- `trg_actuator_on_action` — updates `actuator.status` and `last_triggered_at` when an `Action` row is inserted
- `trg_log_sensor_status` — inserts into `sensor_status_logs` when a `Sensor.is_active` changes
- Threshold breach triggers — create `Alert` rows when sensor readings exceed min/max bounds

After any operation that fires a trigger, Django calls `refresh_from_db()` to read the trigger-updated values before broadcasting them via WebSocket.

---

## API URL Reference

```
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/token/refresh/

GET    /api/users/
POST   /api/users/
GET    /api/users/<id>/
PATCH  /api/users/<id>/
POST   /api/users/<id>/reset-password/

GET    /api/sensors/
PATCH  /api/sensors/<id>/
GET    /api/sensors/<id>/readings/      ?from= &to=
GET    /api/sensors/<id>/latest/

GET    /api/thresholds/
PATCH  /api/thresholds/<sensor_type>/

GET    /api/actuators/
GET    /api/actuators/actions/          ?from= &to=
POST   /api/actuators/<id>/action/

GET    /api/alerts/                     ?severity= &acknowledged= &from= &to=
POST   /api/alerts/<id>/acknowledge/

GET    /api/script-logs/

GET    /api/exports/
POST   /api/exports/

POST   /api/iot/readings/

WS     ws://<host>/ws/dashboard/?token=<access_token>
```
