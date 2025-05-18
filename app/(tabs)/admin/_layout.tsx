import React from 'react';
import { Stack } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { getCurrentUser, supabase } from '@/lib/supabase';

export default function AdminLayout() {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      setLoading(true);
      const { user } = await getCurrentUser();

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Verificar si el usuario es administrador
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error al verificar rol de usuario:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (error) {
      console.error('Error al verificar rol de usuario:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-gray-600">Verificando permisos...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-center mb-4">
          No tienes permisos para acceder a esta sección
        </Text>
      </View>
    );
  }

  return <Stack />;
}
