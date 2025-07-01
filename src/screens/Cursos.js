import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, StyleSheet, ScrollView, Alert, View, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import CursosCard from './CursosCard';
import { supabase } from '../config/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCursos } from '../contexto/CursosContexto';

export default function Cursos({ navigation }) {
  const { cursos, carregarCursos, removerCurso, carregandoCursos } = useCursos();
  const [tipoUsuario, setTipoUsuario] = useState('');

  useEffect(() => {
    async function buscarTipoUsuario() {
      const { data: userData, error: erroUser } = await supabase.auth.getUser();

      if (erroUser || !userData?.user) {
        console.log('Erro ao obter usuário autenticado:', erroUser);
        return;
      }

      const userId = userData.user.id;

      const { data, error } = await supabase
        .from('usuarios')
        .select('tipo')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setTipoUsuario(data.tipo);
      } else {
        console.log('Erro ao obter tipo de usuário:', error);
      }
    }

    buscarTipoUsuario();
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarCursos();
    }, [carregarCursos])
  );

  function handleNovoCurso() {
    if (tipoUsuario === 'admin') {
      navigation.navigate('NovoCurso');
    } else {
      Alert.alert('Acesso negado', 'Acesso apenas para administradores.');
    }
  }

  async function handleExcluirCurso(id) {
    Alert.alert('Confirmação', 'Deseja realmente excluir este curso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('cursos').delete().eq('id', id);
          if (error) {
            Alert.alert('Erro', 'Não foi possível excluir o curso.');
          } else {
            removerCurso(id); // Atualiza no contexto
          }
        },
      },
    ]);
  }

  return (
    <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.titulo}>
          <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={35} color="#1C9B5E" />
          </TouchableOpacity>
          <Text style={styles.tituloPrin}>Cursos</Text>
          <View style={styles.Ghost}></View>
        </View>

        <ScrollView style={styles.scrool}>
          {carregandoCursos && <ActivityIndicator animating />}
          {!carregandoCursos && cursos.length === 0 && (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Nenhum curso disponível.</Text>
          )}
          {cursos.map((curso) => (
            <CursosCard
              key={curso.id}
              {...curso}
              tipoUsuario={tipoUsuario}
              onPress={() => navigation.navigate('DetalheCurso', curso)}
              onEditar={() => navigation.navigate('EditarCurso', curso)}
              onExcluir={() => handleExcluirCurso(curso.id)}
            />
          ))}
        </ScrollView>

        <FAB icon="plus" style={styles.fab} onPress={handleNovoCurso} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 20,
    marginBottom: 25,
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloPrin: {
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 3,
    borderBottomColor: '#1C9B5E',
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
  voltar: {
    marginBottom: 10,
    width: 150,
  },
  Ghost: {
    width: 150,
  },
});
