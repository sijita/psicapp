import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { getAIResponse, resetConversation } from '@/lib/openai';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons } from '@expo/vector-icons';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Mensaje de bienvenida al iniciar la pantalla
  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: 'Hola, soy tu asistente psicológico. ¿En qué puedo ayudarte hoy?',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Obtener respuesta de la IA
      const response = await getAIResponse(inputText);

      // Agregar respuesta de la IA
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          response ||
          'Lo siento, no pude procesar tu mensaje. Por favor, intenta de nuevo.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);

      // Mensaje de error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Ha ocurrido un error. Por favor, intenta de nuevo más tarde.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      className={`p-3 rounded-lg my-1 max-w-[80%] ${
        item.sender === 'user'
          ? 'bg-blue-500 self-end'
          : 'bg-gray-200 self-start'
      }`}
    >
      <Text
        className={`${item.sender === 'user' ? 'text-white' : 'text-gray-800'}`}
      >
        {item.text}
      </Text>
      <Text
        className={`text-xs mt-1 ${
          item.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
        }`}
      >
        {item.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: 'Asistente Psicológico',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Reiniciar conversación',
                  '¿Estás seguro de que deseas reiniciar la conversación? Se perderá todo el historial.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Reiniciar',
                      style: 'destructive',
                      onPress: () => {
                        resetConversation();
                        setMessages([
                          {
                            id: Date.now().toString(),
                            text: 'Hola, soy tu asistente psicológico. ¿En qué puedo ayudarte hoy?',
                            sender: 'ai',
                            timestamp: new Date(),
                          },
                        ]);
                      },
                    },
                  ]
                );
              }}
              className="mr-4"
            >
              <Ionicons name="reload-outline" size={22} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }}
      />

      <View className="flex-1 p-4">
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 10 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      </View>

      {isLoading && (
        <View className="items-center justify-center p-2">
          <ActivityIndicator size="small" color="#4B5563" />
          <Text className="text-gray-600 mt-1">Escribiendo respuesta...</Text>
        </View>
      )}

      <View className="flex-row items-center p-2 border-t border-gray-200">
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
          placeholder="Escribe tu mensaje aquí..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
          onPress={sendMessage}
          disabled={isLoading || inputText.trim() === ''}
        >
          <Ionicons name="paper-plane-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
