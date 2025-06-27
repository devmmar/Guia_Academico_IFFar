import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../config/supabase';
import { useUsuario } from '../contexto/UsuarioContexto';

if (typeof atob === 'undefined') {
  global.atob = (b64) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    b64 = String(b64).replace(/=+$/, '');
    for (
      let bc = 0, bs, buffer, idx = 0;
      (buffer = b64.charAt(idx++));
      ~buffer &&
        ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    return output;
  };
}

export default function Perfil() {
  const { usuario, perfil, setPerfil } = useUsuario();

  const [nome, setNome] = useState(perfil?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [novaFoto, setNovaFoto] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');

  async function escolherImagem() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permissão negada para acessar a galeria.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!resultado.canceled) {
      const imagemUri = resultado.assets[0].uri;
      setNovaFoto(imagemUri);

      try {
        if (perfil?.foto_url) {
          const caminhoAntigo = perfil.foto_url.split('/usuarios/')[1]?.split('?')[0];
          if (caminhoAntigo) {
            await supabase.storage.from('usuarios').remove([caminhoAntigo]);
          }
        }

        const base64 = await FileSystem.readAsStringAsync(imagemUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const extensao = imagemUri.split('.').pop() || 'jpg';
        const nomeArquivo = `fotos_perfil/${usuario.id}_${Date.now()}.${extensao}`;
        const base64Bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        const { error: erroUpload } = await supabase.storage
          .from('usuarios')
          .upload(nomeArquivo, base64Bytes, {
            contentType: extensao === 'jpg' ? 'image/jpeg' : `image/${extensao}`,

            upsert: true,
          });

        if (erroUpload) {
          console.log('Erro real no upload:', erroUpload.message);
          setMensagem('Erro ao enviar a imagem.');
          return;
        }


        const { data: urlData, error: urlErro } = await supabase.storage
          .from('usuarios')
          .getPublicUrl(nomeArquivo);

        if (urlErro || !urlData?.publicUrl) {
          throw new Error('Erro ao gerar a URL pública da imagem.');
        }

        setNovaFoto(urlData.publicUrl);
      } catch (err) {
        setMensagem(err.message);
      }
    }
  }

  async function salvarAlteracoes() {
    setCarregando(true);
    setMensagem('');

    let urlImagem = novaFoto || perfil?.foto_url;

    const { error: erroUpdate } = await supabase
      .from('usuarios')
      .update({ nome: nome.trim(), foto_url: urlImagem })
      .eq('id', usuario.id);

    if (erroUpdate) {
      setMensagem('Erro ao atualizar nome/foto.');
      setCarregando(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if ((email !== usuario.email || novaSenha) && senhaAtual && session?.user) {
      const { error: erroLogin } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: senhaAtual,
      });

      if (erroLogin) {
        setMensagem('Senha atual incorreta.');
        setCarregando(false);
        return;
      }

      if (email !== usuario.email) {
        const { error: erroEmail } = await supabase.auth.updateUser({ email });
        if (erroEmail) {
          setMensagem('Erro ao atualizar e-mail.');
          setCarregando(false);
          return;
        }
      }

      if (novaSenha) {
        const { error: erroSenha } = await supabase.auth.updateUser({ password: novaSenha });
        if (erroSenha) {
          setMensagem('Erro ao atualizar senha.');
          setCarregando(false);
          return;
        }
      }
    }

    setPerfil((antigo) => ({ ...antigo, nome, foto_url: urlImagem }));
    setMensagem('Perfil atualizado com sucesso!');
    setCarregando(false);

    // Oculta a mensagem após 3 segundos
    setTimeout(() => {
      setMensagem('');
    }, 1000);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={escolherImagem}>
        <Image
          source={
            novaFoto
              ? { uri: novaFoto }
              : perfil?.foto_url
                ? { uri: perfil.foto_url }
                : require('../assets/semFoto.jpg')
          }
          style={styles.imagem}
        />
        <Text style={styles.link}>Alterar imagem</Text>
      </TouchableOpacity>

      <TextInput
        label="Nome"
        value={nome}
        onChangeText={setNome}
        mode="outlined"
        style={styles.input}
        theme={inputTheme}
      />
      <TextInput
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        mode="outlined"
        style={styles.input}
        theme={inputTheme}
      />
      <TextInput
        label="Senha atual (necessária para alterar e-mail/senha)"
        value={senhaAtual}
        onChangeText={setSenhaAtual}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        theme={inputTheme}
      />
      <TextInput
        label="Nova Senha"
        value={novaSenha}
        onChangeText={setNovaSenha}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        theme={inputTheme}
      />

      {mensagem !== '' && <Text style={styles.msg}>{mensagem}</Text>}
      {carregando && <ActivityIndicator animating style={{ marginVertical: 10 }} />}

      <Button mode="contained" onPress={salvarAlteracoes} style={styles.botao}>
        Salvar alterações
      </Button>
    </View>
  );
}

const inputTheme = {
  roundness: 12,
  colors: {
    text: '#000',
    primary: '#2e7d32',
    background: '#f2e6f9',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  imagem: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  link: {
    textAlign: 'center',
    color: '#2e7d32',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  botao: {
    marginTop: 10,
  },
  msg: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#2e7d32',
  },
});
