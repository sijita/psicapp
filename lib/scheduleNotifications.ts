import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureNotifications } from './notifications';

// Interfaz para los parámetros de notificación
interface ScheduleNotificationParams {
  id: string;
  title: string;
  body: string;
  day: number; // 0 = Domingo, 1 = Lunes, etc.
  time: string; // formato HH:MM
  minutes: number; // minutos antes para notificar
  data?: any; // datos adicionales para la notificación
}

// Programar una notificación para una actividad del horario
export const scheduleNotification = async (
  params: ScheduleNotificationParams
) => {
  try {
    // Verificar si tenemos permisos
    const hasPermission = await configureNotifications();
    if (!hasPermission) return;

    // Cancelar cualquier notificación existente con el mismo ID
    await cancelScheduledNotification(params.id);

    // Calcular el tiempo para la notificación
    const [hours, minutes] = params.time.split(':').map(Number);

    // Crear un objeto Date para la próxima ocurrencia del día especificado
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    // Calcular cuántos días faltan hasta el próximo día especificado
    let daysUntil = params.day - currentDay;
    if (daysUntil < 0) daysUntil += 7; // Si es negativo, sumar una semana

    // Si es el mismo día, verificar si la hora ya pasó
    if (daysUntil === 0) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Si la hora ya pasó (considerando los minutos de anticipación), programar para la próxima semana
      if (
        currentHour > hours ||
        (currentHour === hours && currentMinute > minutes - params.minutes)
      ) {
        daysUntil = 7;
      }
    }

    // Crear la fecha para la notificación
    const notificationDate = new Date();
    notificationDate.setDate(now.getDate() + daysUntil);
    notificationDate.setHours(hours);
    notificationDate.setMinutes(minutes - params.minutes);
    notificationDate.setSeconds(0);
    notificationDate.setMilliseconds(0);

    // Programar la notificación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: params.data || {},
      },
      trigger: {
        date: notificationDate,
        repeats: true,
        weekday: params.day + 1, // Ajustar para el formato de Expo (1-7 donde 1 es Domingo)
        hour: hours,
        minute: minutes - params.minutes,
      },
    });

    // Guardar el ID de la notificación para poder cancelarla después
    await saveNotificationId(params.id, notificationId);

    return notificationId;
  } catch (error) {
    console.error('Error al programar notificación:', error);
    return null;
  }
};

// Cancelar una notificación programada
export const cancelScheduledNotification = async (itemId: string) => {
  try {
    const notificationId = await getNotificationId(itemId);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await removeNotificationId(itemId);
    }
  } catch (error) {
    console.error('Error al cancelar notificación:', error);
  }
};

// Guardar la relación entre el ID del elemento y el ID de la notificación
const saveNotificationId = async (itemId: string, notificationId: string) => {
  try {
    const notificationsMap = await getNotificationsMap();
    notificationsMap[itemId] = notificationId;
    await AsyncStorage.setItem(
      'scheduleNotificationsMap',
      JSON.stringify(notificationsMap)
    );
  } catch (error) {
    console.error('Error al guardar ID de notificación:', error);
  }
};

// Obtener el ID de notificación para un elemento
const getNotificationId = async (itemId: string) => {
  try {
    const notificationsMap = await getNotificationsMap();
    return notificationsMap[itemId];
  } catch (error) {
    console.error('Error al obtener ID de notificación:', error);
    return null;
  }
};

// Eliminar un ID de notificación
const removeNotificationId = async (itemId: string) => {
  try {
    const notificationsMap = await getNotificationsMap();
    delete notificationsMap[itemId];
    await AsyncStorage.setItem(
      'scheduleNotificationsMap',
      JSON.stringify(notificationsMap)
    );
  } catch (error) {
    console.error('Error al eliminar ID de notificación:', error);
  }
};

// Obtener el mapa de notificaciones
const getNotificationsMap = async () => {
  try {
    const mapString = await AsyncStorage.getItem('scheduleNotificationsMap');
    return mapString ? JSON.parse(mapString) : {};
  } catch (error) {
    console.error('Error al obtener mapa de notificaciones:', error);
    return {};
  }
};

// Verificar y actualizar todas las notificaciones del horario
export const updateAllScheduleNotifications = async () => {
  try {
    const scheduleString = await AsyncStorage.getItem('userSchedule');
    if (!scheduleString) return;

    const schedule = JSON.parse(scheduleString);

    // Cancelar todas las notificaciones existentes
    const notificationsMap = await getNotificationsMap();
    for (const itemId in notificationsMap) {
      await cancelScheduledNotification(itemId);
    }

    // Reprogramar notificaciones para elementos con notificaciones habilitadas
    for (const item of schedule) {
      if (item.notifications && item.notifications.enabled) {
        // Obtener un mensaje de bienestar aleatorio si está habilitado
        let notificationMessage = `Recordatorio: ${item.title} comienza pronto`;
        if (item.notifications.includeWellness) {
          const wellnessMessages = [
            'Recuerda respirar profundamente antes de comenzar.',
            'Toma un momento para estirar tu cuerpo antes de esta actividad.',
            'Hidrátate bien durante esta sesión.',
            'Recuerda mantener una buena postura durante la clase.',
            'Después de esta actividad, tómate 5 minutos para descansar la vista.',
            'Antes de comenzar, establece una intención positiva para esta actividad.',
          ];
          const wellnessMessage =
            wellnessMessages[
              Math.floor(Math.random() * wellnessMessages.length)
            ];
          notificationMessage += ` - ${wellnessMessage}`;
        }

        // Convertir día de la semana a número
        const dayNames = [
          'Domingo',
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
          'Sábado',
        ];
        const dayNumber = dayNames.indexOf(item.day);

        // Programar la notificación
        await scheduleNotification({
          id: item.id,
          title: `Próxima actividad: ${item.title}`,
          body: notificationMessage,
          day: dayNumber,
          time: item.startTime,
          minutes: item.notifications.beforeMinutes,
          data: { screen: 'schedule', itemId: item.id },
        });
      }
    }
  } catch (error) {
    console.error('Error al actualizar notificaciones del horario:', error);
  }
};
