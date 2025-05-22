import { Image, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const FRASES = [
  'Cada día es una nueva oportunidad para crecer.',
  'Confía en tu proceso, los pequeños pasos también cuentan.',
  'Tu bienestar es tu mayor tesoro, cuídalo.',
  'Permítete sentir, aprender y avanzar.',
  'Hoy es un buen día para empezar de nuevo.',
];

function FraseMotivacional({ frase }: { frase: string }) {
  return (
    <ThemedText className="text-xl text-gray-700 text-center italic">
      {frase}
    </ThemedText>
  );
}

export default function HomeScreen() {
  const [frase, setFrase] = useState(
    FRASES[Math.floor(Math.random() * FRASES.length)]
  );
  const recargarFrase = () => {
    let nuevaFrase = frase;
    while (nuevaFrase === frase && FRASES.length > 1) {
      nuevaFrase = FRASES[Math.floor(Math.random() * FRASES.length)];
    }
    setFrase(nuevaFrase);
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/logo-2.jpg')}
          style={{
            height: 140,
            width: 140,
            borderRadius: 70,
            alignSelf: 'center',
            marginTop: 50,
            marginBottom: 8,
          }}
        />
      }
    >
      <ThemedView className="flex-row items-center justify-center mt-6 mb-3">
        <ThemedText
          type="title"
          className="text-3xl font-bold text-[#1D3D47] tracking-wider"
        >
          PsicApp
        </ThemedText>
      </ThemedView>
      <ThemedView className="mt-8 mb-6 items-center px-4">
        <FraseMotivacional frase={frase} />
        <TouchableOpacity
          onPress={recargarFrase}
          className="mt-4 px-6 py-2 bg-blue-500 rounded-full shadow-md"
          accessibilityLabel="Recargar frase motivacional"
        >
          <ThemedText className="text-base font-semibold text-[#1D3D47]">
            Recargar frase
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

export { HelloWave };
