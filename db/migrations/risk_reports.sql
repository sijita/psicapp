-- Definición de la tabla risk_reports para Supabase

-- Crear la tabla de reportes de riesgo
CREATE TABLE IF NOT EXISTS risk_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  detected_keywords TEXT[] NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  severity_level TEXT NOT NULL DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS risk_reports_user_id_idx ON risk_reports(user_id);
CREATE INDEX IF NOT EXISTS risk_reports_reviewed_idx ON risk_reports(reviewed);
CREATE INDEX IF NOT EXISTS risk_reports_severity_level_idx ON risk_reports(severity_level);
CREATE INDEX IF NOT EXISTS risk_reports_timestamp_idx ON risk_reports(timestamp);

-- Configurar RLS (Row Level Security) para proteger los datos
ALTER TABLE risk_reports ENABLE ROW LEVEL SECURITY;

-- Política para que solo los administradores puedan ver todos los reportes
CREATE POLICY "Admins can view all risk reports" 
  ON risk_reports 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Política para que los usuarios solo puedan ver sus propios reportes
CREATE POLICY "Users can view their own risk reports" 
  ON risk_reports 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Política para que solo los administradores puedan actualizar reportes
CREATE POLICY "Only admins can update risk reports" 
  ON risk_reports 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Función para actualizar el timestamp cuando se modifica un registro
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el campo updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON risk_reports
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Comentarios para documentar la tabla
COMMENT ON TABLE risk_reports IS 'Almacena reportes de riesgo de suicidio detectados en conversaciones';
COMMENT ON COLUMN risk_reports.id IS 'Identificador único del reporte';
COMMENT ON COLUMN risk_reports.user_id IS 'ID del usuario relacionado con el reporte';
COMMENT ON COLUMN risk_reports.message_content IS 'Contenido del mensaje que activó la alerta';
COMMENT ON COLUMN risk_reports.detected_keywords IS 'Palabras clave detectadas que indican riesgo';
COMMENT ON COLUMN risk_reports.timestamp IS 'Fecha y hora en que se generó el reporte';
COMMENT ON COLUMN risk_reports.reviewed IS 'Indica si el reporte ha sido revisado por un administrador';
COMMENT ON COLUMN risk_reports.notes IS 'Notas adicionales sobre el reporte';
COMMENT ON COLUMN risk_reports.severity_level IS 'Nivel de severidad del riesgo: bajo, medio o alto';