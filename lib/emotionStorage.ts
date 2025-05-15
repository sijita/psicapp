import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmotionRecord {
  id: string;
  emotion: string;
  intensity: number;
  note?: string;
  timestamp: number;
  date: string;
  time: string;
}

const EMOTION_STORAGE_KEY = '@psicapp_emotion_records';

// Guardar un nuevo registro emocional
export const saveEmotionRecord = async (
  record: Omit<EmotionRecord, 'id'>
): Promise<EmotionRecord> => {
  try {
    // Obtener registros existentes
    const existingRecords = await getEmotionRecords();

    // Crear nuevo registro con ID único
    const newRecord: EmotionRecord = {
      ...record,
      id: Date.now().toString(),
    };

    // Guardar todos los registros
    const updatedRecords = [newRecord, ...existingRecords];
    await AsyncStorage.setItem(
      EMOTION_STORAGE_KEY,
      JSON.stringify(updatedRecords)
    );

    return newRecord;
  } catch (error) {
    console.error('Error al guardar registro emocional:', error);
    throw error;
  }
};

// Obtener todos los registros emocionales
export const getEmotionRecords = async (): Promise<EmotionRecord[]> => {
  try {
    const records = await AsyncStorage.getItem(EMOTION_STORAGE_KEY);
    return records ? JSON.parse(records) : [];
  } catch (error) {
    console.error('Error al obtener registros emocionales:', error);
    return [];
  }
};

// Eliminar un registro emocional por ID
export const deleteEmotionRecord = async (id: string): Promise<void> => {
  try {
    const records = await getEmotionRecords();
    const updatedRecords = records.filter((record) => record.id !== id);
    await AsyncStorage.setItem(
      EMOTION_STORAGE_KEY,
      JSON.stringify(updatedRecords)
    );
  } catch (error) {
    console.error('Error al eliminar registro emocional:', error);
    throw error;
  }
};

// Analizar patrones de estrés
export const analyzeStressPatterns = async (): Promise<{
  weeklyStressCount: number;
  stressfulDays: { [key: string]: number };
  stressfulHours: { [key: string]: number };
  hasStressPattern: boolean;
}> => {
  try {
    const records = await getEmotionRecords();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filtrar registros de la última semana donde la emoción es 'estresado'
    const recentStressRecords = records.filter((record) => {
      const recordDate = new Date(record.timestamp);
      return (
        recordDate >= oneWeekAgo &&
        (record.emotion === 'estresado' || record.emotion === 'ansioso') &&
        record.intensity >= 3
      );
    });

    // Contar ocurrencias por día de la semana
    const stressfulDays: { [key: string]: number } = {};
    // Contar ocurrencias por hora del día
    const stressfulHours: { [key: string]: number } = {};

    recentStressRecords.forEach((record) => {
      const date = new Date(record.timestamp);
      const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' });
      const hour = date.getHours();

      // Incrementar contadores
      stressfulDays[dayOfWeek] = (stressfulDays[dayOfWeek] || 0) + 1;
      stressfulHours[hour] = (stressfulHours[hour] || 0) + 1;
    });

    // Determinar si hay un patrón de estrés (3 o más registros en una semana)
    const hasStressPattern = recentStressRecords.length >= 3;

    return {
      weeklyStressCount: recentStressRecords.length,
      stressfulDays,
      stressfulHours,
      hasStressPattern,
    };
  } catch (error) {
    console.error('Error al analizar patrones de estrés:', error);
    return {
      weeklyStressCount: 0,
      stressfulDays: {},
      stressfulHours: {},
      hasStressPattern: false,
    };
  }
};

// Obtener estrategias para manejar el estrés
export const getStressManagementStrategies = (): string[] => {
  return [
    'Practica respiración profunda durante 5 minutos',
    'Realiza una caminata corta al aire libre',
    'Escucha música relajante',
    'Practica meditación guiada por 10 minutos',
    'Toma un descanso de 15 minutos de tus actividades',
    'Escribe en un diario sobre lo que te preocupa',
    'Realiza estiramientos suaves',
    'Habla con un amigo o familiar sobre cómo te sientes',
    'Toma un baño o ducha caliente',
    'Practica la técnica 5-4-3-2-1: identifica 5 cosas que ves, 4 que puedes tocar, 3 que oyes, 2 que hueles y 1 que saboreas',
  ];
};
