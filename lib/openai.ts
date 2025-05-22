import OpenAI from 'openai';

// Clave de API de Groq desde variables de entorno o valor predeterminado
const apiKey = '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';

// Configuración del cliente de OpenAI pero apuntando a la API de Groq
const groq = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.groq.com/openai/v1', // Endpoint de Groq
  dangerouslyAllowBrowser: true, // Solo para desarrollo, no recomendado en producción
});

// Tipo para los mensajes de la conversación
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Mantener un historial de conversación para contexto
let conversationHistory: ChatMessage[] = [
  {
    role: 'system',
    content:
      'Eres un asistente psicológico empático y profesional. Tu objetivo es proporcionar apoyo emocional, escuchar activamente y ofrecer orientación basada en principios psicológicos establecidos. No diagnosticas ni reemplazas a un profesional de la salud mental, pero puedes ofrecer técnicas de afrontamiento y recursos útiles. Responde en español de manera cálida y comprensiva.',
  },
];

// Función para reiniciar la conversación
export const resetConversation = () => {
  conversationHistory = [
    {
      role: 'system',
      content:
        'Eres un asistente psicológico empático y profesional. Tu objetivo es proporcionar apoyo emocional, escuchar activamente y ofrecer orientación basada en principios psicológicos establecidos. No diagnosticas ni reemplazas a un profesional de la salud mental, pero puedes ofrecer técnicas de afrontamiento y recursos útiles. Responde en español de manera cálida y comprensiva.',
    },
  ];
};

export const getAIResponse = async (message: string) => {
  try {
    // Añadir mensaje del usuario al historial
    conversationHistory.push({
      role: 'user',
      content: message,
    });

    // Limitar el historial a los últimos 10 mensajes para evitar tokens excesivos
    const recentMessages = [
      conversationHistory[0], // Siempre mantener el mensaje del sistema
      ...conversationHistory.slice(-9), // Últimos 9 mensajes (o menos si no hay tantos)
    ];

    const chatCompletion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Modelo de Groq
      messages: recentMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseContent = chatCompletion.choices[0].message.content;

    // Añadir respuesta de la IA al historial
    conversationHistory.push({
      role: 'assistant',
      content: responseContent || 'No response received',
    });

    return responseContent;
  } catch (error) {
    console.error('Error al obtener respuesta de la IA:', error);
    return 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.';
  }
};
