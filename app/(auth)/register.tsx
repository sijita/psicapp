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
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { signUp } from '@/lib/supabase';
import { Image } from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');

  const handleRegister = async () => {
    if (!nombre || !apellido || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signUp(email, password, nombre, apellido);
      if (error) throw error;

      Alert.alert('Registro exitoso', 'Inicia sesión para continuar', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (error: any) {
      console.error('Error de registro:', error);
      Alert.alert(
        'Error de registro',
        error.message || 'Ocurrió un error al registrarse'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white p-6 justify-center"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 50}
    >
      <ScrollView className="flex-1">
        <Stack.Screen options={{ title: 'Registro', headerShown: true }} />

        <View className="items-center mb-8">
          <Image
            source={require('../../assets/images/logo-2.jpg')}
            style={{ width: 200, height: 200, resizeMode: 'contain' }}
          />
        </View>
        <Text className="text-lg mb-6 text-center text-gray-600">
          Crea tu cuenta para comenzar
        </Text>

        <View className="flex-col gap-5 mb-6">
          <TextInput
            className="bg-gray-100 p-4 rounded-lg text-gray-800"
            placeholder="Nombre"
            placeholderTextColor="#9CA3AF"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
          <TextInput
            className="bg-gray-100 p-4 rounded-lg text-gray-800"
            placeholder="Apellido"
            placeholderTextColor="#9CA3AF"
            value={apellido}
            onChangeText={setApellido}
            autoCapitalize="words"
          />
          <TextInput
            className="bg-gray-100 p-4 rounded-lg text-gray-800"
            placeholder="Correo electrónico"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            className="bg-gray-100 p-4 rounded-lg text-gray-800"
            placeholder="Contraseña"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            className="bg-gray-100 p-4 rounded-lg text-gray-800"
            placeholder="Confirmar contraseña"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-lg items-center mb-4"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Registrarse</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text className="text-center text-blue-600">
            ¿Ya tienes una cuenta? Inicia sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
