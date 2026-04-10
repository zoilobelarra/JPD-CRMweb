-- ============================================================
-- ESQUEMA SUPABASE - Gestor de Base de Datos
-- Ejecuta este SQL en el Editor SQL de tu proyecto Supabase
-- ============================================================

-- Tabla de catálogos (acciones, estados, responsables)
CREATE TABLE IF NOT EXISTS catalogos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('accion', 'estado', 'responsable')),
  valor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla principal de registros
CREATE TABLE IF NOT EXISTS registros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  accion_id UUID REFERENCES catalogos(id),
  estado_id UUID REFERENCES catalogos(id),
  responsable_id UUID REFERENCES catalogos(id),
  descripcion TEXT,
  hipervinculo TEXT,
  comentarios TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_registros_updated_at
  BEFORE UPDATE ON registros
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo para catálogos
INSERT INTO catalogos (tipo, valor) VALUES
  ('accion', 'Revisión'),
  ('accion', 'Implementación'),
  ('accion', 'Análisis'),
  ('accion', 'Seguimiento'),
  ('estado', 'Pendiente'),
  ('estado', 'En Progreso'),
  ('estado', 'Completado'),
  ('estado', 'Bloqueado'),
  ('responsable', 'Ana García'),
  ('responsable', 'Carlos López'),
  ('responsable', 'María Rodríguez'),
  ('responsable', 'Juan Martínez');

-- Datos de ejemplo para registros
INSERT INTO registros (fecha, accion_id, estado_id, responsable_id, descripcion, hipervinculo, comentarios)
SELECT
  '2024-01-15',
  (SELECT id FROM catalogos WHERE tipo='accion' AND valor='Revisión' LIMIT 1),
  (SELECT id FROM catalogos WHERE tipo='estado' AND valor='Completado' LIMIT 1),
  (SELECT id FROM catalogos WHERE tipo='responsable' AND valor='Ana García' LIMIT 1),
  'Revisión inicial del sistema de base de datos',
  'https://ejemplo.com/doc1',
  'Revisión completada sin incidencias';

INSERT INTO registros (fecha, accion_id, estado_id, responsable_id, descripcion, hipervinculo, comentarios)
SELECT
  '2024-02-20',
  (SELECT id FROM catalogos WHERE tipo='accion' AND valor='Implementación' LIMIT 1),
  (SELECT id FROM catalogos WHERE tipo='estado' AND valor='En Progreso' LIMIT 1),
  (SELECT id FROM catalogos WHERE tipo='responsable' AND valor='Carlos López' LIMIT 1),
  'Implementación del módulo de reportes',
  'https://ejemplo.com/doc2',
  'Pendiente validación del cliente';

-- Habilitar Row Level Security (RLS) - Opcional para producción
-- ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE catalogos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (ajustar en producción)
-- CREATE POLICY "Allow all" ON registros FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON catalogos FOR ALL USING (true);
