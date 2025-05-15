import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  getEmotionRecords,
  analyzeStressPatterns,
  EmotionRecord,
} from '@/lib/emotionStorage';

export default function EmotionHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Reemplazar useEffect por useFocusEffect para recargar datos al enfocar
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const emotionRecords = await getEmotionRecords();
      setRecords(emotionRecords);

      const stressAnalysis = await analyzeStressPatterns();
      setAnalysis(stressAnalysis);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecords = () => {
    if (selectedFilter === 'all') return records;

    const now = new Date();
    let filterDate = new Date();

    switch (selectedFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return records;
    }

    return records.filter((record) => new Date(record.timestamp) >= filterDate);
  };

  const getEmotionColor = (emotion: string) => {
    const emotionColors: { [key: string]: string } = {
      feliz: '#4ADE80',
      tranquilo: '#60A5FA',
      neutro: '#A1A1AA',
      triste: '#94A3B8',
      ansioso: '#FB923C',
      estresado: '#F87171',
      enojado: '#EF4444',
    };
    return emotionColors[emotion] || '#A1A1AA';
  };

  const getEmotionIcon = (emotion: string) => {
    const emotionIcons: { [key: string]: string } = {
      feliz: 'face.smiling',
      tranquilo: 'moon.stars',
      neutro: 'face.dashed',
      triste: 'face.sad',
      ansioso: 'exclamationmark.circle',
      estresado: 'bolt.fill',
      enojado: 'flame.fill',
    };
    return emotionIcons[emotion] || 'face.dashed';
  };

  const renderAnalysis = () => {
    if (!analysis) return null;

    // Encontrar el día con más estrés
    let maxStressDay = '';
    let maxStressCount = 0;

    Object.entries(analysis.stressfulDays).forEach(
      ([day, count]: [string, any]) => {
        if (count > maxStressCount) {
          maxStressDay = day;
          maxStressCount = count;
        }
      }
    );

    // Encontrar la hora con más estrés
    let maxStressHour = '';
    maxStressCount = 0;

    Object.entries(analysis.stressfulHours).forEach(
      ([hour, count]: [string, any]) => {
        if (count > maxStressCount) {
          maxStressHour = hour;
          maxStressCount = count;
        }
      }
    );

    return (
      <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Análisis de Patrones
        </Text>

        <View className="mb-4">
          <Text className="text-gray-600 mb-1">
            Registros de estrés/ansiedad (última semana)
          </Text>
          <Text className="text-2xl font-bold">
            {analysis.weeklyStressCount}
          </Text>
        </View>

        {maxStressDay && (
          <View className="mb-4">
            <Text className="text-gray-600 mb-1">Día con más estrés</Text>
            <Text className="text-xl font-semibold capitalize">
              {maxStressDay}
            </Text>
          </View>
        )}

        {maxStressHour && (
          <View>
            <Text className="text-gray-600 mb-1">Hora con más estrés</Text>
            <Text className="text-xl font-semibold">{maxStressHour}:00</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmotionDistribution = () => {
    const filteredRecords = getFilteredRecords();
    if (filteredRecords.length === 0) return null;

    // Contar ocurrencias de cada emoción
    const emotionCounts: { [key: string]: number } = {};
    filteredRecords.forEach((record) => {
      emotionCounts[record.emotion] = (emotionCounts[record.emotion] || 0) + 1;
    });

    // Calcular porcentajes
    const total = filteredRecords.length;
    const emotionPercentages = Object.entries(emotionCounts).map(
      ([emotion, count]) => ({
        emotion,
        count,
        percentage: Math.round((count / total) * 100),
      })
    );

    // Ordenar por cantidad (mayor a menor)
    emotionPercentages.sort((a, b) => b.count - a.count);

    return (
      <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Distribución de Emociones
        </Text>

        {emotionPercentages.map(({ emotion, count, percentage }) => (
          <View key={emotion} className="mb-3">
            <View className="flex-row justify-between items-center mb-1">
              <View className="flex-row items-center">
                <View
                  className="w-6 h-6 rounded-full justify-center items-center mr-2"
                  style={{ backgroundColor: `${getEmotionColor(emotion)}30` }}
                >
                  <IconSymbol
                    name={getEmotionIcon(emotion)}
                    size={14}
                    color={getEmotionColor(emotion)}
                  />
                </View>
                <Text className="text-gray-800 capitalize">{emotion}</Text>
              </View>
              <Text className="text-gray-600">
                {count} ({percentage}%)
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: getEmotionColor(emotion),
                }}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Cargando historial...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      <Stack.Screen
        options={{ title: 'Historial Emocional', headerShown: true }}
      />

      {/* Filtros */}
      <View className="flex-row mb-6 bg-white rounded-lg shadow-sm p-1">
        {[
          { id: 'all', label: 'Todo' },
          { id: 'today', label: 'Hoy' },
          { id: 'week', label: 'Semana' },
          { id: 'month', label: 'Mes' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.id}
            onPress={() => setSelectedFilter(filter.id)}
            className={`flex-1 py-2 px-3 rounded-lg ${
              selectedFilter === filter.id ? 'bg-blue-500' : ''
            }`}
          >
            <Text
              className={`text-center ${
                selectedFilter === filter.id
                  ? 'text-white font-semibold'
                  : 'text-gray-600'
              }`}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderAnalysis()}
      {renderEmotionDistribution()}

      {/* Historial de registros */}
      <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Historial de Registros
        </Text>

        {getFilteredRecords().length === 0 ? (
          <Text className="text-gray-500 text-center py-4">
            No hay registros para el período seleccionado
          </Text>
        ) : (
          getFilteredRecords().map((record) => (
            <View
              key={record.id}
              className="flex-row items-center p-3 mb-3 rounded-lg"
              style={{
                backgroundColor: `${getEmotionColor(record.emotion)}15`,
              }}
            >
              <View
                className="w-10 h-10 rounded-full justify-center items-center mr-3"
                style={{
                  backgroundColor: `${getEmotionColor(record.emotion)}30`,
                }}
              >
                <IconSymbol
                  name={getEmotionIcon(record.emotion)}
                  size={20}
                  color={getEmotionColor(record.emotion)}
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
                        className="w-2 h-2 rounded-full mr-1"
                        style={{
                          backgroundColor: getEmotionColor(record.emotion),
                        }}
                      />
                    ))}
                  </View>
                </View>
                {record.note ? (
                  <Text className="text-gray-600 text-sm mt-1">
                    {record.note}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
