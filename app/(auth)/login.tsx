import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { signIn } from '@/lib/supabase';
import { Image } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Error de inicio de sesión',
        error.message || 'Ocurrió un error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white p-6 justify-center"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: 'Iniciar Sesión', headerShown: true }} />

      <View className="items-center mb-8">
        <Image
          source={require('../../assets/images/logo.jpg')}
          style={{ width: 200, height: 200, resizeMode: 'contain' }}
          className="rounded-lg"
        />
      </View>
      <Text className="text-lg mb-6 text-center text-gray-600">
        Asistencia psicológica en tiempo real
      </Text>

      <View className="flex-col gap-5 mb-6">
        <TextInput
          className="bg-gray-100 p-4 rounded-lg text-gray-800"
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          className="bg-gray-100 p-4 rounded-lg text-gray-800"
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 p-4 rounded-lg items-center mb-4"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text className="text-center text-blue-600">
          ¿No tienes una cuenta? Regístrate
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
