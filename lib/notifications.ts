import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar las notificaciones
export const configureNotifications = async () => {
  // Configurar cómo se manejan las notificaciones cuando la app está en primer plano
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Solicitar permisos de notificación (solo en dispositivos reales)
  if (Platform.OS !== 'web') {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Si no tenemos permisos, solicitarlos
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Si aún no tenemos permisos, no podemos mostrar notificaciones
    if (finalStatus !== 'granted') {
      console.log('No se obtuvieron permisos para enviar notificaciones');
      return false;
    }
  }

  return true;
};

// Enviar una notificación de alerta de estrés
export const sendStressPatternNotification = async () => {
  try {
    // Verificar si tenemos permisos
    const hasPermission = await configureNotifications();
    if (!hasPermission) return;

    // Enviar la notificación
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Alerta de patrón de estrés!',
        body: 'Hemos detectado un patrón de estrés en tus registros. Revisa las estrategias recomendadas para ayudarte a manejarlo.',
        data: { screen: 'emotions' },
      },
      trigger: null, // Enviar inmediatamente
    });
  } catch (error) {
    console.error('Error al enviar notificación:', error);
  }
};

// Programar una notificación recordatoria para registrar emociones
export const scheduleEmotionReminderNotification = async (
  hour: number,
  minute: number
) => {
  try {
    // Verificar si tenemos permisos
    const hasPermission = await configureNotifications();
    if (!hasPermission) return;

    // Cancelar cualquier recordatorio existente
    await cancelEmotionReminder();

    // Calcular el primer disparo de la notificación
    const now = new Date();
    let triggerDate = new Date();
    triggerDate.setHours(hour);
    triggerDate.setMinutes(minute);
    triggerDate.setSeconds(0);
    triggerDate.setMilliseconds(0);

    // Si la hora seleccionada ya pasó hoy, programar para el día siguiente
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de registro emocional',
        body: '¿Cómo te sientes hoy? Toma un momento para registrar tus emociones.',
        data: { screen: 'emotions' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        // Para el primer disparo, usar el campo 'startDate' si está disponible
        date: triggerDate,
      },
    });

    return true;
  } catch (error) {
    console.error('Error al programar recordatorio:', error);
    return false;
  }
};

// Cancelar el recordatorio de registro emocional
export const cancelEmotionReminder = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error('Error al cancelar recordatorios:', error);
    return false;
  }
};
