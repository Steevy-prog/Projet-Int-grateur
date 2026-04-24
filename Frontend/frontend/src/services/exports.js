import { download } from './api';

/**
 * POST /api/exports/ — generate and stream a CSV from the server.
 * @param {'sensor_readings'|'actions'|'alerts'} exportType
 * @param {object} filters  Optional: from_date, to_date, sensor_id, sensor_type, severity
 * @param {string} filename Suggested filename for the download
 */
export async function generate(exportType, filters = {}, filename) {
  const body = { export_type: exportType, ...filters };
  const res  = await download('POST', '/api/exports/', body);
  const blob = await res.blob();

  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename || `agrismart_${exportType}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
