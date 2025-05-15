import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import EmotionReminderSettings from '@/components/EmotionReminderSettings';
import {
  saveEmotionRecord,
  getEmotionRecords,
  analyzeStressPatterns,
  getStressManagementStrategies,
  EmotionRecord,
} from '@/lib/emotionStorage';
import { sendStressPatternNotification } from '@/lib/notifications';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const emotions = [
  { name: 'feliz', color: '#4ADE80', icon: 'face-grin-stars' },
  { name: 'tranquilo', color: '#60A5FA', icon: 'face-smile-beam' },
  { name: 'neutro', color: '#A1A1AA', icon: 'face-meh' },
  { name: 'triste', color: '#94A3B8', icon: 'face-sad-tear' },
  { name: 'ansioso', color: '#FB923C', icon: 'face-grin-tongue-wink' },
  { name: 'estresado', color: '#F87171', icon: 'face-rolling-eyes' },
  { name: 'enojado', color: '#EF4444', icon: 'face-angry' },
];

export default function EmotionsScreen() {
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [stressAnalysis, setStressAnalysis] = useState<any>(null);
  const [showStrategies, setShowStrategies] = useState(false);
  const [strategies, setStrategies] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadEmotionRecords();
  }, []);

  const loadEmotionRecords = async () => {
    setLoading(true);
    try {
      const emotionRecords = await getEmotionRecords();
      setRecords(emotionRecords);

      // Analizar patrones de estrés
      const analysis = await analyzeStressPatterns();
      setStressAnalysis(analysis);

      // Si hay un patrón de estrés, mostrar estrategias y enviar notificación
      if (analysis.hasStressPattern) {
        setStrategies(getStressManagementStrategies());
        setShowStrategies(true);

        // Enviar notificación si es la primera vez que se detecta el patrón
        if (!stressAnalysis?.hasStressPattern) {
          sendStressPatternNotification();
        }
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!selectedEmotion) {
      Alert.alert('Error', 'Por favor selecciona una emoción');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const newRecord = {
        emotion: selectedEmotion,
        intensity,
        note,
        timestamp: now.getTime(),
        date: now.toLocaleDateString('es-ES'),
        time: now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      await saveEmotionRecord(newRecord);

      // Limpiar formulario
      setSelectedEmotion('');
      setIntensity(3);
      setNote('');

      // Recargar registros y análisis
      await loadEmotionRecords();

      Alert.alert('Éxito', 'Tu registro emocional ha sido guardado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  const renderIntensitySelector = () => {
    return (
      <View className="flex-row justify-between my-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => setIntensity(value)}
            className={`w-12 h-12 rounded-full justify-center items-center ${
              intensity === value ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`text-lg font-bold ${
                intensity === value ? 'text-white' : 'text-gray-700'
              }`}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStressStrategies = () => {
    if (!showStrategies || !stressAnalysis?.hasStressPattern) return null;

    return (
      <View className="bg-amber-50 p-4 rounded-lg mb-6">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold text-amber-800">
            Recomendaciones
          </Text>
          <TouchableOpacity onPress={() => setShowStrategies(false)}>
            <IconSymbol name="xmark" size={20} color="#92400E" />
          </TouchableOpacity>
        </View>
        <Text className="text-amber-800 mb-3">
          Hemos detectado que has registrado estrés{' '}
          {stressAnalysis.weeklyStressCount} veces esta semana. Aquí tienes
          algunas estrategias que pueden ayudarte:
        </Text>
        <ScrollView className="max-h-40">
          {strategies.map((strategy, index) => (
            <View key={index} className="flex-row items-start mb-2">
              <Text className="text-amber-800 mr-2">•</Text>
              <Text className="text-amber-800 flex-1">{strategy}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-white p-6">
      <Stack.Screen
        options={{ title: 'Registro Emocional', headerShown: true }}
      />

      {renderStressStrategies()}

      <EmotionReminderSettings />

      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          ¿Cómo te sientes hoy?
        </Text>

        <View className="flex-row flex-wrap justify-between">
          {emotions.map((emotion) => (
            <TouchableOpacity
              key={emotion.name}
              onPress={() => setSelectedEmotion(emotion.name)}
              className={`w-[30%] h-24 rounded-lg justify-center items-center mb-4 ${
                selectedEmotion === emotion.name
                  ? 'border-2 border-blue-500'
                  : ''
              }`}
              style={{ backgroundColor: `${emotion.color}20` }} // Color con opacidad
            >
              <FontAwesome6 name={emotion.icon} size={30} color={emotion.color} />
              <Text className="mt-2 text-gray-800 capitalize">
                {emotion.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-2">
          ¿Qué intensidad tiene este sentimiento?
        </Text>
        <Text className="text-gray-600 mb-2">
          1 = Muy leve, 5 = Muy intenso
        </Text>
        {renderIntensitySelector()}
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-2">
          ¿Quieres añadir una nota? (opcional)
        </Text>
        <TextInput
          className="bg-gray-100 p-4 rounded-lg text-gray-800 min-h-[100px]"
          placeholder="Escribe aquí lo que sucedió..."
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 p-4 rounded-lg items-center mb-6"
        onPress={handleSaveRecord}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Guardar Registro</Text>
        )}
      </TouchableOpacity>

      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-gray-800">
            Registros recientes
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/emotion-history')}
            className="flex-row items-center"
          >
            <Text className="text-blue-600 mr-1">Ver historial</Text>
            <IconSymbol name="chevron.right" size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {records.length === 0 ? (
          <Text className="text-gray-500 text-center py-4">
            No hay registros emocionales aún
          </Text>
        ) : (
          records.slice(0, 5).map((record) => {
            const emotion =
              emotions.find((e) => e.name === record.emotion) || emotions[2]; // Default to neutral
            return (
              <View
                key={record.id}
                className="flex-row items-center p-3 mb-2 rounded-lg"
                style={{ backgroundColor: `${emotion.color}15` }}
              >
                <View
                  className="w-10 h-10 rounded-full justify-center items-center mr-3"
                  style={{ backgroundColor: `${emotion.color}30` }}
                >
                  <FontAwesome6
                    name={emotion.icon}
                    size={20}
                    color={emotion.color}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between">
                    <Text className="font-semibold capitalize">
                      {record.emotion}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {record.date} {record.time}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-gray-600 text-sm mr-2">
                      Intensidad: {record.intensity}
                    </Text>
                    <View className="flex-row">
                      {Array.from({ length: record.intensity }).map((_, i) => (
                        <View
                          key={i}
                          className="w-2 h-2 rounded-full bg-gray-400 mr-1"
                        />
                      ))}
                    </View>
                  </View>
                  {record.note ? (
                    <Text
                      className="text-gray-600 text-sm mt-1"
                      numberOfLines={2}
                    >
                      {record.note}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
