/**
 * ============================================================
 * GESTOR JPD — Sincronización Google Drive → Supabase
 * ============================================================
 * Instrucciones de instalación al final del archivo.
 *
 * Funcionamiento:
 *  - Se ejecuta una vez al día (trigger de tiempo)
 *  - Lee los archivos de una carpeta de Google Drive
 *  - El nombre del archivo debe tener este formato:
 *    fecha.accion.responsable.descripcion
 *    Ejemplo: 2024-03-15.Acuerdo.Hecho.JPD Comisión permanente.Texto descriptivo
 *  - Si el archivo es nuevo (no está ya en Supabase), lo inserta
 *  - El hipervínculo se genera automáticamente con el link al archivo
 * ============================================================
 */

// ── CONFIGURACIÓN ─────────────────────────────────────────────
// Rellena estos valores antes de ejecutar el script

var CONFIG = {
  // ID de la carpeta de Google Drive a vigilar
  // Lo encontrarás en la URL de la carpeta:
  // https://drive.google.com/drive/folders/ESTE_ES_EL_ID
  FOLDER_ID: '1MUnYjfDRVrtIi8kknl4OEWPEMyKo7kHq',

  // Credenciales de Supabase
  // Settings → API en tu proyecto de Supabase
  SUPABASE_URL:      'https://jfiaiooitlbzcenmrazc.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_btuZyRZBWm8aDFb9CzbfDg_HNc9f3eH',

  // Nombre de la propiedad donde guardamos los IDs ya procesados
  // (No cambiar salvo que tengas conflictos)
  PROP_KEY: 'archivos_procesados'
};

// ── FUNCIÓN PRINCIPAL ──────────────────────────────────────────
function sincronizarDrive() {
  Logger.log('=== Inicio sincronización ' + new Date().toISOString() + ' ===');

  var folder;
  try {
    folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  } catch (e) {
    Logger.log('ERROR: No se puede acceder a la carpeta. Comprueba FOLDER_ID. ' + e);
    return;
  }

  // Recuperar IDs ya procesados (persistentes entre ejecuciones)
  var props           = PropertiesService.getScriptProperties();
  var procesadosStr   = props.getProperty(CONFIG.PROP_KEY) || '[]';
  var procesados      = JSON.parse(procesadosStr);
  var procesadosSet   = new Set(procesados);

  // Obtener catálogos de Supabase para hacer el matching por nombre
  var catalogos = obtenerCatalogos();
  if (!catalogos) {
    Logger.log('ERROR: No se pudieron obtener los catálogos de Supabase.');
    return;
  }

  // Recorrer todos los archivos de la carpeta
  var files     = folder.getFiles();
  var nuevos    = 0;
  var errores   = 0;
  var omitidos  = 0;

  while (files.hasNext()) {
    var file   = files.next();
    var fileId = file.getId();

    // Saltar si ya fue procesado
    if (procesadosSet.has(fileId)) {
      omitidos++;
      continue;
    }

    var nombre = file.getName();
    Logger.log('Procesando: ' + nombre);

    // Parsear el nombre del archivo
    var datos = parsearNombre(nombre);
    if (!datos) {
      Logger.log('  ✗ Nombre con formato incorrecto, se omite: ' + nombre);
      errores++;
      procesadosSet.add(fileId); // Marcar para no reintentar
      continue;
    }

    // Resolver IDs de catálogo
    var accionId      = resolverCatalogo(catalogos, 'accion',      datos.accion);
    var responsableId = resolverCatalogo(catalogos, 'responsable', datos.responsable);

    // Construir hipervínculo al archivo en Drive
    var hipervinculo = 'https://drive.google.com/file/d/' + fileId + '/view?usp=drive_link';
    // Para Google Docs/Sheets/Slides el link es diferente
    var mimeType = file.getMimeType();
    if (mimeType === 'application/vnd.google-apps.document') {
      hipervinculo = 'https://docs.google.com/document/d/' + fileId + '/edit';
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      hipervinculo = 'https://docs.google.com/spreadsheets/d/' + fileId + '/edit';
    } else if (mimeType === 'application/vnd.google-apps.presentation') {
      hipervinculo = 'https://docs.google.com/presentation/d/' + fileId + '/edit';
    }

    // Insertar en Supabase
    var registro = {
      fecha:           datos.fecha,
      accion_id:       accionId      || null,
      estado_id:       null,
      responsable_id:  responsableId || null,
      descripcion:     datos.descripcion || null,
      hipervinculo:    hipervinculo,
      comentarios:     null
    };

    var ok = insertarRegistro(registro);
    if (ok) {
      Logger.log('  ✓ Insertado correctamente');
      nuevos++;
      procesadosSet.add(fileId);
    } else {
      Logger.log('  ✗ Error al insertar en Supabase');
      errores++;
    }

    // Pequeña pausa para no saturar la API
    Utilities.sleep(300);
  }

  // Guardar la lista actualizada de procesados
  props.setProperty(CONFIG.PROP_KEY, JSON.stringify(Array.from(procesadosSet)));

  Logger.log('=== Fin sincronización ===');
  Logger.log('Nuevos: ' + nuevos + ' | Omitidos (ya existían): ' + omitidos + ' | Errores: ' + errores);
}


// ── PARSEAR NOMBRE DE ARCHIVO ──────────────────────────────────
/**
 * Formato esperado: fecha.accion.responsable.descripcion
 * Ejemplo: 2024-03-15.Acuerdo.Hecho.JPD Comisión permanente.Texto de descripción
 *
 * La extensión del archivo (.pdf, .docx, etc.) se elimina automáticamente.
 * La descripción puede contener puntos sin problema (se toma todo lo que quede).
 */
function parsearNombre(nombre) {
  // Eliminar extensión si la hay (.pdf, .docx, .xlsx, etc.)
  var sinExtension = nombre.replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim();

  // Separar por punto — máximo 5 partes, la última puede tener puntos
  var partes = sinExtension.split('.');

  if (partes.length < 3) {
    Logger.log('  Partes encontradas: ' + partes.length + ' (mínimo 3)');
    return null;
  }

  var fecha       = partes[0].trim();
  var accion      = partes[1].trim();
  var responsable = partes[2].trim();
  // La descripción puede contener puntos: unir el resto
  var descripcion = partes.slice(3).join('.').trim() || null;

  // Validar formato de fecha (acepta YYYY-MM-DD y DD/MM/YYYY)
  fecha = normalizarFecha(fecha);
  if (!fecha) {
    Logger.log('  Fecha inválida: ' + partes[0]);
    return null;
  }

  return {
    fecha:       fecha,
    accion:      accion,
    responsable: responsable,
    descripcion: descripcion
  };
}

function normalizarFecha(str) {
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // DD/MM/YYYY
  var m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return m[3] + '-' + m[2] + '-' + m[1];
  // DD-MM-YYYY
  var m2 = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m2) return m2[3] + '-' + m2[2] + '-' + m2[1];
  return null;
}


// ── SUPABASE: OBTENER CATÁLOGOS ────────────────────────────────
function obtenerCatalogos() {
  var url = CONFIG.SUPABASE_URL + '/rest/v1/catalogos?select=id,tipo,valor';
  var options = {
    method: 'GET',
    headers: {
      'apikey':        CONFIG.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY,
      'Content-Type':  'application/json'
    },
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code     = response.getResponseCode();
    if (code !== 200) {
      Logger.log('Error obteniendo catálogos. HTTP ' + code + ': ' + response.getContentText());
      return null;
    }
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log('Excepción obteniendo catálogos: ' + e);
    return null;
  }
}

// Busca el ID de un valor en el catálogo (insensible a mayúsculas/tildes)
function resolverCatalogo(catalogos, tipo, valor) {
  if (!valor) return null;
  var valorNorm = valor.toLowerCase().trim();
  for (var i = 0; i < catalogos.length; i++) {
    var c = catalogos[i];
    if (c.tipo === tipo && c.valor.toLowerCase().trim() === valorNorm) {
      return c.id;
    }
  }
  // Si no encuentra coincidencia exacta, intenta coincidencia parcial
  for (var j = 0; j < catalogos.length; j++) {
    var c2 = catalogos[j];
    if (c2.tipo === tipo && c2.valor.toLowerCase().includes(valorNorm)) {
      Logger.log('  Coincidencia parcial para "' + valor + '" → "' + c2.valor + '"');
      return c2.id;
    }
  }
  Logger.log('  AVISO: No se encontró "' + valor + '" en catálogo de ' + tipo);
  return null;
}


// ── SUPABASE: INSERTAR REGISTRO ────────────────────────────────
function insertarRegistro(registro) {
  var url = CONFIG.SUPABASE_URL + '/rest/v1/registros';
  var payload = JSON.stringify(registro);

  var options = {
    method: 'POST',
    headers: {
      'apikey':        CONFIG.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal'
    },
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code     = response.getResponseCode();
    if (code === 201) return true;
    Logger.log('  Error Supabase HTTP ' + code + ': ' + response.getContentText());
    return false;
  } catch (e) {
    Logger.log('  Excepción insertando registro: ' + e);
    return false;
  }
}


// ── UTILIDADES ─────────────────────────────────────────────────

/**
 * Ejecuta una sincronización manual desde el editor.
 * Útil para probar antes de activar el trigger automático.
 */
function ejecutarManual() {
  sincronizarDrive();
}

/**
 * Resetea la lista de archivos procesados.
 * Útil si quieres re-importar todos los archivos desde cero.
 * ¡CUIDADO: puede crear duplicados si los registros ya existen!
 */
function resetearProcesados() {
  PropertiesService.getScriptProperties().deleteProperty(CONFIG.PROP_KEY);
  Logger.log('Lista de procesados reseteada.');
}

/**
 * Muestra en el log cuántos archivos han sido procesados ya.
 */
function verEstado() {
  var props        = PropertiesService.getScriptProperties();
  var procesadosStr = props.getProperty(CONFIG.PROP_KEY) || '[]';
  var procesados   = JSON.parse(procesadosStr);
  Logger.log('Archivos procesados hasta ahora: ' + procesados.length);
}
