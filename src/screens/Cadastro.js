import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';

export default function Cadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function fazerCadastro() {
    setCarregando(true);
    setErro('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error || !data?.user) {
      setErro('Erro ao cadastrar. Tente outro e-mail.');
      console.log(error);
      setCarregando(false);
      return;
    }

    const userId = data.user.id;

    const { error: insertError } = await supabase
      .from('usuarios')
      .insert([{ id: userId, nome, tipo: 'aluno' }]);

    if (insertError) {
      setErro('Usuário criado, mas houve erro ao salvar o nome.');
      console.log(insertError);
    } else {
      navigation.replace('Login');
    }

    setCarregando(false);
  }

  return (
    <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Image
          style={styles.img}
          source={{
            uri: 'https://www.iffarroupilha.edu.br/component/k2/attachments/download/2364/d41a992a42da72ea71ecdd799fbfcb3b'
          }}
        />

        <TextInput
          label="Nome Completo"
          value={nome}
          onChangeText={setNome}
          mode="outlined"
          theme={{
            roundness: 12,
            colors: {
              text: '#000',
              primary: '#2e7d32',
              background: '#f2e6f9',
              outline: 'transparent',
            }
          }}
          style={styles.input}
        />

        <TextInput
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          mode="outlined"
          theme={{
            roundness: 12,
            colors: {
              text: '#000',
              primary: '#2e7d32',
              background: '#f2e6f9',
              outline: 'transparent',
            }
          }}
          style={styles.input}
        />

        <TextInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          mode="outlined"
          theme={{
            roundness: 12,
            colors: {
              text: '#000',
              primary: '#2e7d32',
              background: '#f2e6f9',
              outline: 'transparent',
            }
          }}
          style={styles.input}
        />

        {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
        {carregando && <ActivityIndicator animating style={{ marginVertical: 10 }} />}

        <Button
          mode="contained"
          onPress={fazerCadastro}
          style={styles.botao}
          disabled={carregando}
        >
          Cadastrar
        </Button>

        <Button mode="text" onPress={() => navigation.navigate('Login')}>
          Já possuí conta? Fazer login
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },

  titulo: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center'
  },

  input: {
    marginBottom: 16,
    color: 'black',
    borderRadius: 20,
  },

  botao: {
    marginVertical: 10
  },

  erro: {
    color: '#C4112F',
    textAlign: 'center',
    marginBottom: 10
  },

  img: {
    resizeMode: 'contain',
    height: 200,
    marginBottom: 15,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center'
  }
});
