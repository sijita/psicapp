import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  scheduleEmotionReminderNotification,
  cancelEmotionReminder,
} from '@/lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_SETTINGS_KEY = '@psicapp_emotion_reminder_settings';

interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const defaultSettings: ReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
};

export default function EmotionReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings>(defaultSettings);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState(20);
  const [tempMinute, setTempMinute] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error al cargar configuración de recordatorios:', error);
    }
  };

  const saveSettings = async (newSettings: ReminderSettings) => {
    try {
      await AsyncStorage.setItem(
        REMINDER_SETTINGS_KEY,
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);

      // Actualizar las notificaciones según la configuración
      if (newSettings.enabled) {
        const success = await scheduleEmotionReminderNotification(
          newSettings.hour,
          newSettings.minute
        );
        if (!success) {
          Alert.alert(
            'Error',
            'No se pudieron programar las notificaciones. Por favor verifica los permisos de la aplicación.'
          );
        }
      } else {
        await cancelEmotionReminder();
      }
    } catch (error) {
      console.error('Error al guardar configuración de recordatorios:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const toggleReminder = () => {
    saveSettings({ ...settings, enabled: !settings.enabled });
  };

  const openTimePicker = () => {
    setTempHour(settings.hour);
    setTempMinute(settings.minute);
    setShowTimePicker(true);
  };

  const saveTime = () => {
    saveSettings({ ...settings, hour: tempHour, minute: tempMinute });
    setShowTimePicker(false);
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const renderTimePicker = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 15, 30, 45];

    return (
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text className="text-blue-600">Cancelar</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Seleccionar hora</Text>
              <TouchableOpacity onPress={saveTime}>
                <Text className="text-blue-600 font-semibold">Guardar</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mb-6">
              <Text className="text-2xl font-bold">
                {formatTime(tempHour, tempMinute)}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 mb-2">Hora</Text>
              <View className="flex-row flex-wrap">
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={`hour-${hour}`}
                    onPress={() => setTempHour(hour)}
                    className={`w-12 h-12 rounded-full justify-center items-center m-1 ${
                      tempHour === hour ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`${
                        tempHour === hour ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {hour % 12 || 12}
                    </Text>
                    <Text
                      className={`text-xs ${
                        tempHour === hour ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {hour >= 12 ? 'PM' : 'AM'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-gray-600 mb-2">Minutos</Text>
              <View className="flex-row justify-center">
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={`minute-${minute}`}
                    onPress={() => setTempMinute(minute)}
                    className={`w-16 h-12 rounded-lg justify-center items-center m-1 ${
                      tempMinute === minute ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`${
                        tempMinute === minute ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        Recordatorio diario
      </Text>

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-gray-600">Activar recordatorio</Text>
        <Switch
          value={settings.enabled}
          onValueChange={toggleReminder}
          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
          thumbColor={settings.enabled ? '#3B82F6' : '#F3F4F6'}
        />
      </View>

      <TouchableOpacity
        onPress={openTimePicker}
        className={`flex-row justify-between items-center py-3 ${
          !settings.enabled ? 'opacity-50' : ''
        }`}
        disabled={!settings.enabled}
      >
        <Text className="text-gray-600">Hora del recordatorio</Text>
        <View className="flex-row items-center">
          <Text className="text-gray-800 mr-2">
            {formatTime(settings.hour, settings.minute)}
          </Text>
          <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <Text className="text-gray-500 text-sm mt-2">
        Recibirás una notificación diaria para registrar tus emociones
      </Text>

      {renderTimePicker()}
    </View>
  );
}
