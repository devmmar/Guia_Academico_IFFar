import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { useCursos } from '../contexto/CursosContexto'; // ✅ Correto

// Compatibilidade com base64 no ambiente React Native
if (typeof atob === 'undefined') {
  global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
}

export default function NovoCurso({ navigation }) {
  const [nome, setNome] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [nivel, setNivel] = useState('');
  const [turno, setTurno] = useState('');
  const [unidade, setUnidade] = useState('');
  const [duracao, setDuracao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const { adicionarCurso } = useCursos(); // ✅ Hook do contexto

  async function selecionarPDF() {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (resultado.canceled || !resultado.assets) return;

    const uri = resultado.assets[0].uri;
    const nome = resultado.assets[0].name || `arquivo_${Date.now()}.pdf`;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const { error } = await supabase.storage.from('eventos').upload(nome, bytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (error) {
      setErro('Erro ao enviar PDF');
      return;
    }

    const { data: urlData, error: urlError } = supabase.storage.from('eventos').getPublicUrl(nome);

    if (urlError || !urlData?.publicUrl) {
      setErro('Erro ao obter URL do PDF');
      return;
    }

    setPdfUrl(urlData.publicUrl);
  }

  async function salvarCurso() {
    setCarregando(true);
    setErro('');

    if (!nome.trim() || !modalidade.trim() || !nivel.trim() || !turno.trim()) {
      setErro('Preencha todos os campos obrigatórios.');
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from('cursos')
      .insert([{
        nome: nome.trim(),
        modalidade: modalidade.trim(),
        nivel: nivel.trim(),
        turno: turno.trim(),
        unidade: unidade.trim(),
        duracao: duracao.trim(),
        descricao: descricao.trim(),
        arquivo_url: pdfUrl || null,
      }])
      .select()
      .single(); // ✅ para obter o curso recém criado com id

    if (error) {
      console.log(error);
      setErro('Erro ao salvar curso.');
      setCarregando(false);
      return;
    }

    adicionarCurso(data); // ✅ Atualiza a lista do contexto
    setCarregando(false);
    navigation.goBack();
  }

  return (
    <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.container}>
          <Image
            style={styles.img}
            source={{ uri: 'https://www.iffarroupilha.edu.br/component/k2/attachments/download/2364/d41a992a42da72ea71ecdd799fbfcb3b' }}
          />

          <Text style={styles.titulo}>Novo Curso</Text>

          <TextInput label="Nome" value={nome} onChangeText={setNome} mode="outlined" style={styles.input} theme={inputTheme} />
          <TextInput label="Descrição" value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} mode="outlined" style={styles.input} theme={inputTheme} />
          <TextInput label="Duração" value={duracao} onChangeText={setDuracao} mode="outlined" style={styles.input} theme={inputTheme} />
          <TextInput label="Turno" value={turno} onChangeText={setTurno} mode="outlined" style={styles.input} theme={inputTheme} />
          <TextInput label="Nível" value={nivel} onChangeText={setNivel} mode="outlined" style={styles.input} theme={inputTheme} />
          <TextInput label="Modalidade" value={modalidade} onChangeText={setModalidade} mode="outlined" style={styles.input} theme={inputTheme} />
          <TextInput label="Unidade" value={unidade} onChangeText={setUnidade} mode="outlined" style={styles.input} theme={inputTheme} />

          <Button mode="outlined" onPress={selecionarPDF} style={styles.botao}>
            {pdfUrl ? 'PDF Selecionado' : 'Adicionar PDF'}
          </Button>

          {pdfUrl !== '' && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: 'green' }}>PDF anexado com sucesso</Text>
              <Text numberOfLines={1} style={{ fontSize: 14, color: 'blue' }}>
                {pdfUrl.split('/').pop()}
              </Text>
            </View>
          )}

          {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

          {carregando ? (
            <ActivityIndicator animating />
          ) : (
            <Button mode="contained" onPress={salvarCurso} style={styles.botao}>
              Cadastrar Curso
            </Button>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    marginBottom: 20,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
    color: 'black',
    borderRadius: 20,
  },
  botao: {
    marginTop: 10,
    padding: 6,
  },
  erro: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  img: {
    resizeMode: 'contain',
    height: 200,
    marginBottom: 15,
    width: 200,
    alignSelf: 'center',
  },
});
