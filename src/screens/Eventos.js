import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EventosCard from './EventosCard';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useEventos } from '../contexto/EventosContexto';
import { supabase } from '../config/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Eventos({ navigation }) {
  const { eventos, carregarEventos, removerEventoPorId } = useEventos();
  const [carregando, setCarregando] = useState(true);
  const [tipoUsuario, setTipoUsuario] = useState('');

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function buscarTudo() {
        setCarregando(true);
        await Promise.all([
          carregarEventos(),
          buscarTipoUsuario()
        ]);
        if (ativo) setCarregando(false);
      }

      async function buscarTipoUsuario() {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (user?.id) {
          const { data, error } = await supabase
            .from('usuarios')
            .select('tipo')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setTipoUsuario(data.tipo);
          }
        }
      }

      buscarTudo();

      return () => {
        ativo = false;
      };
    }, [])
  );

  function handleNovoEvento() {
    if (tipoUsuario === 'admin') {
      navigation.navigate('NovoEvento');
    } else {
      Alert.alert('Acesso negado', 'Acesso apenas para administradores.');
    }
  }

  return (
    <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.titulo}>
                    <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={35} color="#1C9B5E" />
                    </TouchableOpacity>
                    <Text style={styles.tituloPrin}>Eventos</Text>

                    <View style={styles.Ghost}>

                    </View>
                </View>
        <ScrollView style={styles.scrool}>
          {carregando && <ActivityIndicator animating />}
          {!carregando && eventos.length === 0 && <Text style={styles.tituloRegis}>Não tem registros</Text>}
          {eventos.map((evento, index) => (
            <EventosCard
              key={index}
              {...evento}
              tipoUsuario={tipoUsuario}
              onPress={() => navigation.navigate('DetalheEventos', evento)}
              onExcluir={() => {
                Alert.alert('Confirmar', 'Deseja encerrar este evento?', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Encerrar',
                    style: 'destructive',
                    onPress: async () => {
                      setCarregando(true); // força reload visual
                      const { error } = await supabase
                        .from('eventos')
                        .update({ ativo: false })
                        .eq('id', evento.id);

                      if (error) {
                        setCarregando(false);
                        Alert.alert('Erro', 'Erro ao encerrar o evento.');
                      } else {
                        await carregarEventos(); // recarrega lista da fonte
                        setCarregando(false); // libera visual
                        Alert.alert('Sucesso', 'Evento encerrado com sucesso.');
                      }
                    },
                  },
                ]);
              }}

              onEditar={() => navigation.navigate('EditarEvento', evento)}
            />
          ))}
        </ScrollView>

        <FAB icon="plus" style={styles.fab} onPress={handleNovoEvento} />
        <FAB icon="history" style={styles.fabHistory} onPress={() => navigation.navigate('HistoricoEventos')} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  titulo: {
        fontSize: 20,
        marginBottom: 25,
        marginTop: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    tituloPrin: {
        fontSize: 20,
        fontWeight: 'bold',
        borderBottomWidth: 3,
        borderBottomColor: '#1C9B5E'
    },

    tituloRegis: {
        fontSize: 20,
        fontWeight: 'bold',
        borderBottomWidth: 3,
        borderBottomColor: '#1C9B5E',
        width: 156
    },

    voltar: {
        marginBottom: 10,
        width: 130
    },
    voltarTexto: {
        color: '#1C9B5E',
        fontSize: 35,
        fontWeight: 'bold',
    },

    Ghost: {
        width: 130
    },
  scrool: {
    width: '90%',
  },
  fab: {
    backgroundColor: '#1C9B5E',
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fabHistory: {
    backgroundColor: '#1C9B5E',
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
});
