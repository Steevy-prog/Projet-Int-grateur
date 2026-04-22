/* ── Auth ─────────────────────────────────────────────────── */
export type UserRole     = 'admin' | 'viewer'
export type UserLanguage = 'fr' | 'en'

export interface User {
  id:        string
  username:  string
  email:     string
  role:      UserRole
  language:  UserLanguage
  is_active: boolean
  created_at:string
  created_by?: string
}

/* ── Sensors ──────────────────────────────────────────────── */
export type SensorType =
  | 'humidity'
  | 'temperature'
  | 'co2'
  | 'luminosity'
  | 'water_level'

export type SensorStatus = 'online' | 'offline' | 'error'

export interface Sensor {
  id:        string
  name:      string
  type:      SensorType
  unit:      string
  location:  string
  is_active: boolean
  created_at:string
  // Computed on frontend
  status?:   SensorStatus
  latestValue?: number
}

export interface SensorReading {
  id:          string
  sensor_id:   string
  value:       number
  measured_at: string
  // Joined fields
  sensor_name?: string
  sensor_type?: SensorType
  sensor_unit?: string
}

/* ── Thresholds ───────────────────────────────────────────── */
export interface Threshold {
  id:          string
  sensor_type: SensorType
  min_value:   number | null
  max_value:   number | null
  set_by:      string | null
  updated_at:  string
}

/* ── Actuators ────────────────────────────────────────────── */
export type ActuatorType   = 'pump' | 'ventilation' | 'lighting'
export type ActuatorStatus = 'on' | 'off'

export interface Actuator {
  id:                string
  name:              string
  type:              ActuatorType
  status:            ActuatorStatus
  last_triggered_at: string | null
  created_at:        string
}

/* ── Actions ──────────────────────────────────────────────── */
export type ActionType   = 'turn_on' | 'turn_off'
export type ActionSource = 'web' | 'cli' | 'auto'

export interface Action {
  id:             string
  actuator_id:    string
  triggered_by:   string | null
  action_type:    ActionType
  source:         ActionSource
  notes:          string | null
  triggered_at:   string
  // Joined fields
  actuator_name?:   string
  actuator_type?:   ActuatorType
  triggered_by_username?: string
}

/* ── Alerts ───────────────────────────────────────────────── */
export type AlertType     = 'low_humidity' | 'high_temperature' | 'low_temperature'
  | 'high_co2' | 'low_water_level' | 'low_luminosity' | 'sensor_failure'
export type AlertSeverity = 'high' | 'medium' | 'low'

export interface Alert {
  id:               string
  sensor_id:        string | null
  actuator_id:      string | null
  type:             AlertType
  message:          string
  severity:         AlertSeverity
  is_acknowledged:  boolean
  acknowledged_by:  string | null
  triggered_at:     string
  acknowledged_at:  string | null
  // Joined fields
  sensor_name?:      string
  sensor_type?:      SensorType
  actuator_name?:    string
  acknowledged_by_username?: string
}

/* ── Script Logs ──────────────────────────────────────────── */
export interface ScriptLog {
  id:           string
  executed_by:  string | null
  command:      string
  result:       string | null
  source:       ActionSource
  executed_at:  string
  // Joined
  executed_by_username?: string
}

/* ── Exports ──────────────────────────────────────────────── */
export type ExportType = 'sensor_readings' | 'actions' | 'alerts'

export interface Export {
  id:          string
  exported_by: string
  export_type: ExportType
  filters:     Record<string, unknown> | null
  file_path:   string | null
  created_at:  string
}

/* ── API responses ────────────────────────────────────────── */
export interface PaginatedResponse<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
}

export interface ApiError {
  message: string
  code?:   string
}
