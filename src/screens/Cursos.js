import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ScrollView, Alert, View, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import CursosCard from './CursosCard';
import { supabase } from '../config/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Cursos({ navigation }) {
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tipoUsuario, setTipoUsuario] = useState('');

  useEffect(() => {
    async function buscarCursos() {
      const { data, error } = await supabase.from('cursos').select('*');

      if (error) {
        console.log(error);
      } else {
        setCursos(data);
      }

      setCarregando(false);
    }

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
    buscarCursos();
  }, []);

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
            setCursos((prev) => prev.filter((curso) => curso.id !== id));
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

          <View style={styles.Ghost}>

          </View>
        </View>
        <ScrollView style={styles.scrool}>
          {carregando && <ActivityIndicator animating />}
          {!carregando && cursos.length === 0 && <Text>Não tem registros</Text>}
          {cursos.map((curso, index) => (
            <CursosCard
              key={index}
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
});
