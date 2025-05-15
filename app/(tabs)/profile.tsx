import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getCurrentUser, signOut } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { user: userData, error } = await getCurrentUser();
        if (error) throw error;
        setUser(userData);
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cerrar sesión');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-6">
      <Stack.Screen options={{ title: 'Mi Perfil', headerShown: true }} />

      <View className="items-center mb-8 mt-4">
        <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-4">
          <IconSymbol name="person.fill" size={50} color="#3B82F6" />
        </View>
        <Text className="text-2xl font-bold text-gray-800">{user?.email}</Text>
      </View>

      <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Información de la cuenta
        </Text>

        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-600">Email</Text>
          <Text className="text-gray-800">{user?.email}</Text>
        </View>

        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-600">Estado</Text>
          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-green-800 text-sm">Activo</Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Preferencias
        </Text>

        <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-600">Notificaciones</Text>
          <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-600">Privacidad</Text>
          <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-red-500 p-4 rounded-lg items-center mt-auto"
        onPress={handleSignOut}
      >
        <Text className="text-white font-bold text-lg">Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
