import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../config/supabase';

export default function Loading({ navigation }) {
  useEffect(() => {
    async function verificarSessao() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Erro ao obter sessão:', error);
        navigation.replace('Login');
        return;
      }

      if (data?.session?.user) {
        navigation.replace('Tabs');
      } else {
        navigation.replace('Login');
      }
    }

    verificarSessao();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
