import React, { useState } from "react";
import { View, StyleSheet, Image } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { supabase } from "../config/supabase";
import { useUsuario } from "../contexto/UsuarioContexto";

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const { setUsuario, setPerfil } = useUsuario();

  async function fazerLogin() {
    setCarregando(true);
    setErro('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error || !data?.user) {
      setErro('E-mail ou senha incorretos');
      console.log(error);
      setCarregando(false);
      return;
    }

    const user = data.user;

    const { data: perfilUsuario, error: erroPerfil } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (erroPerfil) {
      console.log('Erro ao buscar perfil:', erroPerfil);
      setErro('Erro ao carregar o perfil do usuário');
      setCarregando(false);
      return;
    }

    setUsuario(user);
    setPerfil(perfilUsuario);

    navigation.replace('Tabs');
    setCarregando(false);
  }

  return (
    <View style={styles.container}>
      <Image
        style={styles.img}
        source={{
          uri: 'https://www.iffarroupilha.edu.br/component/k2/attachments/download/2364/d41a992a42da72ea71ecdd799fbfcb3b'
        }}
      />

      <TextInput
        label="E-mail"
        value={email}
        onChangeText={setEmail}
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
        keyboardType="email-address"
      />

      <TextInput
        label="Senha"
        value={senha}
        onChangeText={setSenha}
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
        secureTextEntry
      />

      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
      {carregando && <ActivityIndicator animating style={{ marginVertical: 10 }} />}

      <Button
        mode="contained"
        onPress={fazerLogin}
        style={styles.botao}
        disabled={carregando}
      >
        Entrar
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Cadastro')}
      >
        Cadastrar-se
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    marginBottom: 16,
    color: 'black',
    borderRadius: 20,
  },
  botao: {
    marginVertical: 10,
  },
  erro: {
    color: '#C4112F',
    textAlign: 'center',
    marginBottom: 10,
  },
  img: {
    resizeMode: 'contain',
    height: 200,
    marginBottom: 15,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
