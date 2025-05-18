import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white p-6">
      <Stack.Screen
        options={{
          title: 'Panel de Administración',
          headerShown: true,
        }}
      />

      <Text className="text-2xl font-bold mb-6 text-gray-800">
        Panel de Administración
      </Text>

      <TouchableOpacity
        className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex-row items-center shadow-sm"
        onPress={() => router.push('/admin/risk-reports')}
      >
        <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
          <Ionicons name="warning-outline" size={24} color="#EF4444" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">
            Reportes de Riesgo
          </Text>
          <Text className="text-gray-600">
            Revisar alertas de mensajes con contenido sensible
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Aquí se pueden agregar más opciones para administradores */}
    </View>
  );
}
