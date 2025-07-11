import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import debounce from 'lodash.debounce';

if (typeof atob === 'undefined') {
  global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
}

function aplicarMascaraData(texto) {
  const somenteDigitos = texto.replace(/\D/g, '');
  let resultado = '';

  if (somenteDigitos.length <= 2) {
    resultado = somenteDigitos;
  } else if (somenteDigitos.length <= 4) {
    resultado = `${somenteDigitos.slice(0, 2)}/${somenteDigitos.slice(2)}`;
  } else {
    resultado = `${somenteDigitos.slice(0, 2)}/${somenteDigitos.slice(2, 4)}/${somenteDigitos.slice(4, 8)}`;
  }

  return resultado;
}

function formatarDataParaISO(dataTexto) {
  const [dia, mes, ano] = dataTexto.split('/');
  if (!dia || !mes || !ano) return null;

  const iso = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  const dataValida = new Date(iso);
  return isNaN(dataValida.getTime()) ? null : iso;
}

export default function NovoEvento({ navigation }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [local, setLocal] = useState('');
  const [total_vagas, setTotalVagas] = useState('');
  const [inscricao, setInscricao] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [localizacao, setLocalizacao] = useState(null);
  const [fotosSelecionadas, setFotosSelecionadas] = useState([]);
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const buscarSugestoesEndereco = debounce(async (texto) => {
    if (!texto.trim()) {
      setSugestoes([]);
      return;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`, {
        headers: {
          'User-Agent': 'GuiaIFFar/1.0 (vitor.machado@iffar.edu.br)' // deve ser real e funcional
        }
      });

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const erroHTML = await response.text();
        console.warn("⚠️ Nominatim retornou HTML:", erroHTML.slice(0, 200));
        return;
      }

      const data = await response.json();
      setSugestoes(data);
      setMostrarSugestoes(true);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    }
  }, 600);

  function formatarEnderecoCompleto(displayName) {
    if (!displayName) return '';
    const partes = displayName.split(',').map(p => p.trim());
    const ruaNumero = partes[0] || '';
    const bairro = partes[1] || '';
    const cidade = partes[2] || '';
    return [ruaNumero, bairro, cidade].filter(Boolean).join(', ');
  }


  const selecionarImagem = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permissão negada para acessar a galeria.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!resultado.canceled) {
      const novas = resultado.assets.map((img) => img.uri);
      setFotosSelecionadas([...fotosSelecionadas, ...novas]);
    }
  };

  const uploadVariasFotos = async (eventoId) => {
    for (const uri of fotosSelecionadas) {
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const extensao = uri.split('.').pop() || 'jpg';
        const nomeImagem = `evento_${eventoId}_${Date.now()}.${extensao}`;
        const base64Bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        const { error: uploadError } = await supabase
          .storage
          .from('eventos')
          .upload(nomeImagem, base64Bytes, {
            contentType: `image/${extensao}`,
            upsert: true,
          });

        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from('eventos').getPublicUrl(nomeImagem);
        const url = urlData?.publicUrl;

        if (url) {
          await supabase.from('fotos_evento').insert({
            evento_id: eventoId,
            foto_url: url,
          });
        }
      } catch (err) {
        console.error('Erro ao enviar imagem:', err);
      }
    }
  };

  async function salvarEvento() {
    setCarregando(true);
    setErro('');

    const dataISO = formatarDataParaISO(data.trim());

    if (!titulo.trim() || !descricao.trim() || !dataISO || !localizacao || !total_vagas.trim()) {
      setErro('Preencha todos os campos obrigatórios com uma data válida (ex: 25/12/2025).');
      setCarregando(false);
      return;
    }

    if (fotosSelecionadas.length === 0) {
      setErro('Selecione ao menos uma imagem.');
      setCarregando(false);
      return;
    }

    const vagas = parseInt(total_vagas);

    const { data: eventoCriado, error } = await supabase
      .from('eventos')
      .insert([{
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        data: dataISO,
        latitude: localizacao?.latitude,
        longitude: localizacao?.longitude,
        total_vagas: vagas,
        vagas_disponiveis: vagas,
        inscricao,
        foto_url: null
      }])
      .select()
      .single();

    if (error || !eventoCriado) {
      setErro('Erro ao salvar evento.');
      setCarregando(false);
      return;
    }

    await uploadVariasFotos(eventoCriado.id);

    setCarregando(false);
    navigation.goBack();
  }

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErro('Permissão para acesso à localização foi negada');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocalizacao({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  return (
    <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <KeyboardAwareScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.section}>
              <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={35} color="#1C9B5E" />
              </TouchableOpacity>
              <Text style={styles.tituloPrin}>Novo Evento</Text>
              <View style={styles.Ghost} />
            </View>

            <Image
              style={styles.img}
              source={{ uri: 'https://www.iffarroupilha.edu.br/component/k2/attachments/download/2364/d41a992a42da72ea71ecdd799fbfcb3b' }}
            />

            <TextInput label="Título" value={titulo} onChangeText={setTitulo} mode="outlined" style={styles.input} theme={inputTheme} />
            <TextInput label="Descrição" value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} mode="outlined" style={styles.input} theme={inputTheme} />
            <TextInput
              label="Data (ex: 25/12/2025)"
              value={data}
              onChangeText={(texto) => setData(aplicarMascaraData(texto))}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              theme={inputTheme}
            />
            <TextInput label="Vagas" value={total_vagas} onChangeText={setTotalVagas} keyboardType="numeric" mode="outlined" style={styles.input} theme={inputTheme} />

            <TextInput
              label="Endereço"
              value={local}
              onChangeText={(texto) => {
                setLocal(texto);
                buscarSugestoesEndereco(texto);
              }}
              mode="outlined"
              style={[styles.input, { marginBottom: 4 }]} // pequena margem extra
              theme={inputTheme}
            />

            {mostrarSugestoes && sugestoes.length > 0 && (
              <View style={styles.listaSugestoes}>
                {sugestoes.map((item) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.sugestaoItem}
                    onPress={() => {
                      setLocal(formatarEnderecoCompleto(item.display_name));
                      setLocalizacao({
                        latitude: parseFloat(item.lat),
                        longitude: parseFloat(item.lon)
                      });
                      setMostrarSugestoes(false);
                      setSugestoes([]);
                    }}
                  >
                    <Text>{formatarEnderecoCompleto(item.display_name)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {localizacao && (
              <View style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#1C9B5E',
                overflow: 'hidden',
                marginTop: 20,
                marginBottom: 20
              }}>
                <MapView
                  style={{ width: '100%', height: 250, borderRadius: 10 }}
                  region={{
                    latitude: localizacao.latitude,
                    longitude: localizacao.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  onPress={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setLocalizacao({ latitude, longitude });
                  }}
                >
                  <Marker coordinate={localizacao} />
                </MapView>
              </View>
            )}

            <Text style={{ marginBottom: 8, fontSize: 16 }}>Inscrição</Text>
            <View style={styles.radioContainer}>
              {[true, false].map((item) => (
                <TouchableOpacity key={item.toString()} style={styles.radioItem} onPress={() => setInscricao(item)}>
                  <View style={[styles.radioOuter, inscricao === item && styles.radioOuterSelected]}>
                    {inscricao === item && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>{item ? 'Aberta' : 'Fechada'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button mode="outlined" onPress={selecionarImagem} style={{ marginBottom: 1 }}>
              Adicionar Imagens
            </Button>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {fotosSelecionadas.map((uri, index) => (
                <Image key={index} source={{ uri }} style={{ width: 120, height: 120, marginRight: 10, borderRadius: 8 }} />
              ))}
            </ScrollView>

            {carregandoFoto && <ActivityIndicator animating />}
            {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

            {carregando ? (
              <ActivityIndicator animating />
            ) : (
              <Button mode="contained" onPress={salvarEvento} style={styles.botao}>
                Cadastrar Evento
              </Button>
            )}
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
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
  container: { padding: 20 },
  section: {
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
  voltar: {
    marginBottom: 10,
    width: 130
  },
  Ghost: {
    width: 130
  },
  input: {
    marginBottom: 16,
    color: 'black',
    borderRadius: 20,
  },
  botao: {
    borderRadius: 25,
    marginTop: 1,
    padding: 6
  },
  erro: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center'
  },
  img: {
    resizeMode: 'contain',
    height: 200,
    marginBottom: 15,
    width: 200,
    alignSelf: 'center',
  },
  radioContainer: {
    marginBottom: 20
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1C9B5E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioOuterSelected: {
    borderColor: '#1C9B5E'
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#1C9B5E',
  },
  radioLabel: {
    fontSize: 16,
    color: '#000'
  },
  listaSugestoes: {
    position: 'relative',
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 4,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 100,
  },

  sugestaoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
