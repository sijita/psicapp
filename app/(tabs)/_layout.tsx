import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { user, error } = await getCurrentUser();
      setIsAuthenticated(!!user);
      if (!user) {
        setIsAdmin(false); // Limpiar estado admin si no hay usuario
      }
      // Si no está autenticado y no está en una ruta de autenticación, redirigir a login
      const inAuthGroup = segments[0] === '(auth)';
      if (!user && !inAuthGroup) {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router, segments]);

  const checkUserRole = async () => {
    try {
      const { user } = await getCurrentUser();

      // Verificar si el usuario es administrador
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
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
    }
  };

  // Mostrar las pestañas solo si el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      checkUserRole();
    } else {
      setIsAdmin(false); // Limpiar estado admin si el usuario no está autenticado
    }
  }, [isAuthenticated]);

  if (isAuthenticated === false) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons size={18} name="home-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <Ionicons size={18} name="chatbox-ellipses-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emotions"
        options={{
          title: 'Emociones',
          tabBarIcon: ({ color }) => (
            <Ionicons size={18} name="heart-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emotion-history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => (
            <Ionicons size={18} name="list-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Horario',
          tabBarIcon: ({ color }) => (
            <Ionicons size={18} name="calendar-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons size={18} name="person-circle-outline" color={color} />
          ),
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color }) => (
              <Ionicons size={18} name="settings-outline" color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
