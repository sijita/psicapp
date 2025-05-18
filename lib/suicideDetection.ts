import { supabase } from './supabase';
import { getCurrentUser } from './supabase';
import * as Notifications from 'expo-notifications';

// Lista de palabras clave relacionadas con suicidio
const suicideKeywords = [
  'suicidio',
  'suicidarme',
  'matarme',
  'quitarme la vida',
  'no quiero vivir',
  'acabar con mi vida',
  'terminar con todo',
  'ya no aguanto más',
  'mejor morir',
  'desaparecer para siempre',
  'no vale la pena seguir',
];

// Interfaz para los reportes de riesgo
export interface RiskReport {
  id?: string;
  user_id: string;
  message_content: string;
  detected_keywords: string[];
  timestamp: string;
  reviewed: boolean;
  severity_level?: 'low' | 'medium' | 'high';
  notes?: string;
}

/**
 * Detecta palabras clave relacionadas con suicidio en un mensaje
 * @param message El mensaje a analizar
 * @returns Un objeto con el resultado de la detección
 */
export const detectSuicideRisk = (
  message: string
): {
  isAtRisk: boolean;
  detectedKeywords: string[];
} => {
  const normalizedMessage = message.toLowerCase();
  const detectedKeywords = suicideKeywords.filter((keyword) =>
    normalizedMessage.includes(keyword.toLowerCase())
  );

  return {
    isAtRisk: detectedKeywords.length > 0,
    detectedKeywords,
  };
};

/**
 * Crea un reporte de riesgo en la base de datos
 * @param messageContent El contenido del mensaje
 * @param detectedKeywords Las palabras clave detectadas
 * @returns El resultado de la operación
 */
export const createRiskReport = async (
  messageContent: string,
  detectedKeywords: string[]
) => {
  try {
    const { user, error: userError } = await getCurrentUser();

    if (userError || !user) {
      console.error('Error al obtener el usuario actual:', userError);
      return { success: false, error: userError };
    }

    const report: RiskReport = {
      user_id: user.id,
      message_content: messageContent,
      detected_keywords: detectedKeywords,
      timestamp: new Date().toISOString(),
      reviewed: false,
    };

    const { data, error } = await supabase
      .from('risk_reports')
      .insert(report)
      .select();

    if (error) {
      console.error('Error al crear reporte de riesgo:', error);
      return { success: false, error };
    }

    // Notificar a los administradores
    await notifyAdmins(report);

    return { success: true, data };
  } catch (error) {
    console.error('Error inesperado al crear reporte:', error);
    return { success: false, error };
  }
};

/**
 * Obtiene todos los reportes de riesgo
 * @param onlyUnreviewed Si es true, solo devuelve los reportes no revisados
 * @returns Lista de reportes de riesgo
 */
export const getRiskReports = async (onlyUnreviewed = false) => {
  try {
    // Modificamos la consulta para obtener solo los reportes de riesgo
    // sin intentar hacer join con profiles
    let query = supabase
      .from('risk_reports')
      .select('*')
      .order('timestamp', { ascending: false });

    if (onlyUnreviewed) {
      query = query.eq('reviewed', false);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error al obtener reportes de riesgo:', error);
      return { success: false, error };
    }

    // Si no hay reportes, devolvemos un array vacío
    if (!reports || reports.length === 0) {
      return { success: true, data: [] };
    }

    try {
      // Obtenemos los IDs de usuarios únicos de los reportes
      const userIds = [...new Set(reports.map((report) => report.user_id))];

      // Obtenemos los perfiles de los usuarios
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error al obtener perfiles de usuario:', profilesError);
        // Devolvemos los reportes sin información de perfiles
        return { success: true, data: reports };
      }

      // Creamos un mapa de perfiles por ID para acceso rápido
      const profilesMap = {};
      profiles.forEach((profile) => {
        profilesMap[profile.id] = profile;
      });

      // Combinamos los reportes con la información de perfiles
      const reportsWithProfiles = reports.map((report) => ({
        ...report,
        profile: profilesMap[report.user_id] || null,
      }));

      return { success: true, data: reportsWithProfiles };
    } catch (profileError) {
      console.error('Error al procesar perfiles:', profileError);
      // En caso de error, devolvemos los reportes sin información de perfiles
      return { success: true, data: reports };
    }
  } catch (error) {
    console.error('Error inesperado al obtener reportes:', error);
    return { success: false, error };
  }
};

/**
 * Actualiza el estado de revisión de un reporte
 * @param reportId ID del reporte
 * @param reviewed Estado de revisión
 * @param notes Notas opcionales
 * @param severityLevel Nivel de severidad opcional
 * @returns Resultado de la operación
 */
/**
 * Notifica a los administradores sobre un nuevo reporte de riesgo
 * @param report El reporte de riesgo creado
 * @returns Resultado de la operación
 */
export const notifyAdmins = async (report: RiskReport) => {
  try {
    // Obtener usuarios con rol de administrador
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .eq('role', 'admin');

    if (adminsError) {
      console.error('Error al obtener administradores:', adminsError);
      return { success: false, error: adminsError };
    }

    if (!admins || admins.length === 0) {
      console.warn('No se encontraron administradores para notificar');
      return { success: true, data: null };
    }

    // Crear notificaciones para cada administrador
    const notificationPromises = admins.map(async (admin) => {
      try {
        // Crear registro de notificación en la base de datos
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: admin.id,
            title: 'Alerta: Posible riesgo de suicidio',
            message: `Se ha detectado un mensaje con posible riesgo de suicidio. Revisa los reportes de riesgo.`,
            related_id: report.id,
            related_type: 'risk_report',
            read: false,
            created_at: new Date().toISOString(),
          });

        if (notifError) {
          console.error(
            `Error al crear notificación para admin ${admin.id}:`,
            notifError
          );
        }

        // Enviar notificación push si está disponible
        if (Notifications) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'URGENTE: Alerta de riesgo de suicidio',
              body: `Se ha detectado un mensaje con palabras clave relacionadas con suicidio. Revisa los reportes de riesgo inmediatamente.`,
              data: { screen: 'admin', reportId: report.id },
            },
            trigger: null, // Enviar inmediatamente
          });
        }

        return { success: true, adminId: admin.id };
      } catch (error) {
        console.error(`Error al notificar al admin ${admin.id}:`, error);
        return { success: false, adminId: admin.id, error };
      }
    });

    // Esperar a que todas las notificaciones se procesen
    const results = await Promise.all(notificationPromises);

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error('Error inesperado al notificar a administradores:', error);
    return { success: false, error };
  }
};

/**
 * Actualiza el estado de revisión de un reporte
 * @param reportId ID del reporte
 * @param reviewed Estado de revisión
 * @param notes Notas opcionales
 * @param severityLevel Nivel de severidad opcional
 * @returns Resultado de la operación
 */
export const updateRiskReport = async (
  reportId: string,
  reviewed: boolean,
  notes?: string,
  severityLevel?: 'low' | 'medium' | 'high'
) => {
  try {
    const updateData: Partial<RiskReport> = { reviewed };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (severityLevel !== undefined) {
      updateData.severity_level = severityLevel;
    }

    const { data, error } = await supabase
      .from('risk_reports')
      .update(updateData)
      .eq('id', reportId)
      .select();

    if (error) {
      console.error('Error al actualizar reporte de riesgo:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error inesperado al actualizar reporte:', error);
    return { success: false, error };
  }
};
