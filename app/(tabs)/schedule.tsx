import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Text,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  scheduleNotification,
  cancelScheduledNotification,
  updateAllScheduleNotifications,
} from '@/lib/scheduleNotifications';
import { Ionicons } from '@expo/vector-icons';

// Tipos de datos
interface ScheduleItem {
  id: string;
  title: string;
  type: 'class' | 'break' | 'activity';
  day: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  notifications: {
    enabled: boolean;
    beforeMinutes: number;
    includeWellness: boolean;
  };
}

const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const ITEM_TYPES = [
  { id: 'class', name: 'Clase', color: '#60A5FA' },
  { id: 'break', name: 'Descanso', color: '#4ADE80' },
  { id: 'activity', name: 'Actividad', color: '#F87171' },
];

const WELLNESS_MESSAGES = [
  'Recuerda respirar profundamente antes de comenzar.',
  'Toma un momento para estirar tu cuerpo antes de esta actividad.',
  'Hidrátate bien durante esta sesión.',
  'Recuerda mantener una buena postura durante la clase.',
  'Después de esta actividad, tómate 5 minutos para descansar la vista.',
  'Antes de comenzar, establece una intención positiva para esta actividad.',
];

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [currentDay, setCurrentDay] = useState(DAYS_OF_WEEK[0]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Campos del formulario
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'class' | 'break' | 'activity'>('class');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState(15);
  const [includeWellness, setIncludeWellness] = useState(true);

  // Cargar horario al iniciar y actualizar notificaciones
  useEffect(() => {
    loadSchedule();
    // Actualizar todas las notificaciones programadas
    updateAllScheduleNotifications();

    // Añadir listeners para detectar cuando el teclado se muestra/oculta
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    // Limpiar listeners al desmontar
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const loadSchedule = async () => {
    try {
      const savedSchedule = await AsyncStorage.getItem('userSchedule');
      if (savedSchedule) {
        setSchedule(JSON.parse(savedSchedule));
      }
    } catch (error) {
      console.error('Error al cargar el horario:', error);
    }
  };

  const saveSchedule = async (newSchedule: ScheduleItem[]) => {
    try {
      await AsyncStorage.setItem('userSchedule', JSON.stringify(newSchedule));
      setSchedule(newSchedule);
    } catch (error) {
      console.error('Error al guardar el horario:', error);
    }
  };

  const handleAddItem = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setType(item.type);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setLocation(item.location || '');
    setNotes(item.notes || '');
    setNotificationsEnabled(item.notifications.enabled);
    setNotifyBeforeMinutes(item.notifications.beforeMinutes);
    setIncludeWellness(item.notifications.includeWellness);
    setModalVisible(true);
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este elemento del horario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            // Cancelar notificaciones asociadas
            const itemToDelete = schedule.find((item) => item.id === id);
            if (itemToDelete && itemToDelete.notifications.enabled) {
              await cancelScheduledNotification(id);
            }

            const newSchedule = schedule.filter((item) => item.id !== id);
            await saveSchedule(newSchedule);
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitle('');
    setType('class');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setNotes('');
    setNotificationsEnabled(true);
    setNotifyBeforeMinutes(15);
    setIncludeWellness(true);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título');
      return false;
    }
    if (!startTime) {
      Alert.alert('Error', 'Por favor selecciona una hora de inicio');
      return false;
    }
    if (!endTime) {
      Alert.alert('Error', 'Por favor selecciona una hora de finalización');
      return false;
    }

    // Validar formato de hora (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert('Error', 'El formato de hora debe ser HH:MM');
      return false;
    }

    return true;
  };

  const handleSaveItem = async () => {
    if (!validateForm()) return;

    const newItem: ScheduleItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      title,
      type,
      day: currentDay,
      startTime,
      endTime,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      notifications: {
        enabled: notificationsEnabled,
        beforeMinutes: notifyBeforeMinutes,
        includeWellness,
      },
    };

    let newSchedule: ScheduleItem[];

    if (editingItem) {
      // Actualizar elemento existente
      newSchedule = schedule.map((item) =>
        item.id === editingItem.id ? newItem : item
      );
    } else {
      // Agregar nuevo elemento
      newSchedule = [...schedule, newItem];
    }

    // Guardar en AsyncStorage
    await saveSchedule(newSchedule);

    // Programar notificación si está habilitada
    if (notificationsEnabled) {
      // Cancelar notificación anterior si estamos editando
      if (editingItem) {
        await cancelScheduledNotification(newItem.id);
      }

      // Obtener un mensaje de bienestar aleatorio si está habilitado
      let notificationMessage = `Recordatorio: ${newItem.title} comienza pronto`;
      if (includeWellness) {
        const wellnessMessage =
          WELLNESS_MESSAGES[
            Math.floor(Math.random() * WELLNESS_MESSAGES.length)
          ];
        notificationMessage += ` - ${wellnessMessage}`;
      }

      // Programar la notificación
      await scheduleNotification({
        id: newItem.id,
        title: `Próxima actividad: ${newItem.title}`,
        body: notificationMessage,
        day: getDayNumber(currentDay),
        time: startTime,
        minutes: notifyBeforeMinutes,
        data: { screen: 'schedule', itemId: newItem.id },
      });
    }

    setModalVisible(false);
    resetForm();
  };

  // Convertir día de la semana a número (0 = Domingo, 1 = Lunes, etc.)
  const getDayNumber = (day: string) => {
    const index = DAYS_OF_WEEK.indexOf(day);
    // Ajustar para que Lunes sea 1, Martes sea 2, etc. y Domingo sea 0
    return index === 6 ? 0 : index + 1;
  };

  const getItemTypeColor = (itemType: string) => {
    const type = ITEM_TYPES.find((t) => t.id === itemType);
    return type ? type.color : '#A1A1AA';
  };

  const getItemTypeName = (itemType: string) => {
    const type = ITEM_TYPES.find((t) => t.id === itemType);
    return type ? type.name : 'Desconocido';
  };

  const renderScheduleItems = () => {
    const dayItems = schedule
      .filter((item) => item.day === currentDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (dayItems.length === 0) {
      return (
        <View className="bg-white rounded-lg shadow-sm p-6 items-center">
          <Text className="text-gray-600 mb-4 text-center">
            No hay actividades programadas para este día. Toca el botón + para
            agregar una nueva actividad.
          </Text>
        </View>
      );
    }

    return dayItems.map((item) => (
      <View
        key={item.id}
        className="bg-white rounded-lg shadow-sm p-4 mb-4 flex-row justify-between items-start border border-gray-100"
        style={{
          borderLeftWidth: 4,
          borderLeftColor: getItemTypeColor(item.type),
        }}
      >
        <View style={{ flex: 1 }}>
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            {item.title}
          </Text>
          <Text className="text-xs text-gray-500 mb-1">
            {ITEM_TYPES.find((t) => t.id === item.type)?.name} •{' '}
            {item.startTime} - {item.endTime}
          </Text>
          {item.location ? (
            <Text className="text-xs text-gray-500 mb-1">
              Lugar: {item.location}
            </Text>
          ) : null}
          {item.notes ? (
            <Text className="text-xs text-gray-500">Notas: {item.notes}</Text>
          ) : null}
          {item.notifications.enabled && (
            <View className="mt-2 flex-row items-center">
              <IconSymbol name="bell" size={14} color="#60A5FA" />
              <Text className="text-xs ml-1 text-gray-500">
                Notificación {item.notifications.beforeMinutes} min antes
                {item.notifications.includeWellness
                  ? ' • Con mensaje de bienestar'
                  : ''}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center ml-2">
          <TouchableOpacity
            onPress={() => handleEditItem(item)}
            className="mr-2 p-2 bg-blue-100 rounded-full"
          >
            <Ionicons name="pencil" size={18} color="#60A5FA" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteItem(item.id)}
            className="p-2 bg-red-100 rounded-full"
          >
            <Ionicons name="trash" size={18} color="#F87171" />
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  return (
    <ScrollView className="flex-1 bg-white p-6">
      <Stack.Screen options={{ title: 'Mi Horario', headerShown: true }} />
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Mi Horario Académico
        </Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              '¿Cómo funciona?',
              'Aquí puedes agregar y ver tus actividades académicas.'
            )
          }
        >
          <Text className="text-blue-600 mb-4">¿Cómo funciona?</Text>
        </TouchableOpacity>
        <ScrollView horizontal className="flex-row mb-4">
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => setCurrentDay(day)}
              className={`px-4 py-2 rounded-full mr-2 ${
                currentDay === day ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`${
                  currentDay === day ? 'text-white' : 'text-gray-700'
                }`}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <TouchableOpacity
        onPress={handleAddItem}
        className="w-full h-12 flex justify-center rounded-full bg-blue-500 text-whitenter items-center shadow-md mb-10"
      >
        <IconSymbol name="plus" size={28} color={'#fff'} />
      </TouchableOpacity>
      <View className="mb-6">{renderScheduleItems()}</View>
      {/* Modal para agregar/editar actividades */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          enabled={Platform.OS === 'ios'}
        >
          {Platform.OS === 'android' && (
            <View style={{ height: keyboardVisible ? '40%' : '0%' }} />
          )}
          <TouchableOpacity
            className="flex-1 justify-end bg-black/50"
            activeOpacity={1}
            onPress={() => Keyboard.dismiss()}
          >
            <View className="bg-white rounded-t-xl p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold text-gray-800">
                  {editingItem ? 'Editar actividad' : 'Nueva actividad'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Ionicons name="close-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView
                className={`${
                  keyboardVisible ? 'max-h-[35vh]' : 'max-h-[50vh]'
                }`}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {/* Título */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Título
                  </Text>
                  <TextInput
                    className="bg-gray-100 p-3 rounded-lg text-gray-800"
                    placeholder="Título de la actividad"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {/* Tipo de actividad */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </Text>
                  <View className="flex-row justify-between">
                    {ITEM_TYPES.map((itemType) => (
                      <TouchableOpacity
                        key={itemType.id}
                        onPress={() =>
                          setType(itemType.id as 'class' | 'break' | 'activity')
                        }
                        className={`flex-1 p-3 rounded-lg mr-2 ${
                          type === itemType.id ? 'bg-blue-100' : 'bg-gray-100'
                        }`}
                        style={
                          type === itemType.id
                            ? { borderColor: itemType.color, borderWidth: 1 }
                            : {}
                        }
                      >
                        <Text
                          className={`text-center ${
                            type === itemType.id
                              ? 'text-blue-800'
                              : 'text-gray-700'
                          }`}
                        >
                          {itemType.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Horario */}
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                      Hora inicio
                    </Text>
                    <TextInput
                      className="bg-gray-100 p-3 rounded-lg text-gray-800"
                      placeholder="HH:MM"
                      value={startTime}
                      onChangeText={setStartTime}
                      keyboardType="numbers-and-punctuation"
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                      Hora fin
                    </Text>
                    <TextInput
                      className="bg-gray-100 p-3 rounded-lg text-gray-800"
                      placeholder="HH:MM"
                      value={endTime}
                      onChangeText={setEndTime}
                      keyboardType="numbers-and-punctuation"
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                  </View>
                </View>

                {/* Ubicación */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Ubicación (opcional)
                  </Text>
                  <TextInput
                    className="bg-gray-100 p-3 rounded-lg text-gray-800"
                    placeholder="Ubicación de la actividad"
                    value={location}
                    onChangeText={setLocation}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>

                {/* Notas */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </Text>
                  <TextInput
                    className="bg-gray-100 p-3 rounded-lg text-gray-800"
                    placeholder="Notas adicionales"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    returnKeyType="done"
                  />
                </View>

                {/* Configuración de notificaciones */}
                <View className="mb-4 bg-gray-50 p-3 rounded-lg">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm font-medium text-gray-700">
                      Activar notificaciones
                    </Text>
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                      thumbColor={notificationsEnabled ? '#3B82F6' : '#9CA3AF'}
                    />
                  </View>

                  {notificationsEnabled && (
                    <>
                      <View className="mb-3">
                        <Text className="text-sm font-medium text-gray-700 mb-1">
                          Notificar antes (minutos)
                        </Text>
                        <View className="flex-row justify-between">
                          {[5, 10, 15, 30, 60].map((mins) => (
                            <TouchableOpacity
                              key={mins}
                              onPress={() => setNotifyBeforeMinutes(mins)}
                              className={`py-2 px-3 rounded-lg ${
                                notifyBeforeMinutes === mins
                                  ? 'bg-blue-100'
                                  : 'bg-gray-100'
                              }`}
                            >
                              <Text
                                className={`text-center ${
                                  notifyBeforeMinutes === mins
                                    ? 'text-blue-800'
                                    : 'text-gray-700'
                                }`}
                              >
                                {mins}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View className="flex-row justify-between items-center">
                        <Text className="text-sm font-medium text-gray-700">
                          Incluir mensaje de bienestar
                        </Text>
                        <Switch
                          value={includeWellness}
                          onValueChange={setIncludeWellness}
                          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                          thumbColor={includeWellness ? '#3B82F6' : '#9CA3AF'}
                        />
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>

              {/* Botones de acción */}
              <View className="flex-row justify-between mt-4">
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  className="flex-1 mr-2 p-3 rounded-lg bg-gray-200"
                >
                  <Text className="text-center font-medium text-gray-700">
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveItem}
                  className="flex-1 p-3 rounded-lg bg-blue-500"
                >
                  <Text className="text-center font-medium text-white">
                    {editingItem ? 'Actualizar' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
