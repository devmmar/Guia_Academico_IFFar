import {
  StyleSheet, View, Alert, Image, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView,
  Platform, FlatList, Dimensions, ActivityIndicator
} from "react-native";
import { Card, Divider, Text, Button, Badge } from "react-native-paper";
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import MapView, { Marker } from 'react-native-maps';
import * as Calendar from 'expo-calendar';
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function DetalheEventos({ route, navigation }) {
  const {
    id = '',
    titulo = '',
    local = '',
    data = '',
    descricao = '',
    vagas_disponiveis = 0,
    total_vagas = 0,
    foto_url = '',
    latitude = -27.0,
    longitude = -53.0
  } = route.params || {};


  const [vagasDisponiveis, setVagasDisponiveis] = useState(vagas_disponiveis != null ? vagas_disponiveis : total_vagas);
  const [usuarioInscrito, setUsuarioInscrito] = useState(false);
  const [curtido, setCurtido] = useState(false);
  const [totalCurtidas, setTotalCurtidas] = useState(0);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState(null);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [comentarios, setComentarios] = useState([]);
  const [fotosEvento, setFotosEvento] = useState([]);
  const [carregandoFotos, setCarregandoFotos] = useState(true);


  const eventoEncerrado = new Date(data) < new Date();

  async function carregarDadosEvento() {
    const { data, error } = await supabase
      .from('eventos')
      .select('vagas_disponiveis')
      .eq('id', id)
      .single();

    if (data && !error) {
      setVagasDisponiveis(data.vagas_disponiveis);
    }
  }

  async function carregarFotosEvento() {
    const { data, error } = await supabase
      .from('fotos_evento')
      .select('foto_url')
      .eq('evento_id', id);

    if (!error) setFotosEvento(data);

    setCarregandoFotos(false);
  }

  async function verificarCurtida() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data: curtidas } = await supabase
      .from('curtidas')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('evento_id', id);

    setCurtido(curtidas.length > 0);
  }

  async function contarCurtidas() {
    const { count } = await supabase
      .from('curtidas')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', id);

    setTotalCurtidas(count || 0);
  }

  async function alternarCurtida() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    if (curtido) {
      await supabase.from('curtidas')
        .delete()
        .eq('usuario_id', user.id)
        .eq('evento_id', id);
    } else {
      await supabase.from('curtidas')
        .insert({ usuario_id: user.id, evento_id: id });
    }

    verificarCurtida();
    contarCurtidas();
  }

  async function enviarComentario() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return Alert.alert('Erro', 'Usuário não autenticado');
    if (!comentarioTexto.trim()) return;

    await supabase.from('comentarios').insert({
      usuario_id: user.id,
      evento_id: id,
      comentario: comentarioTexto.trim()
    });

    setComentarioTexto('');
    carregarComentarios();
  }

  async function carregarComentarios() {
    const { data, error } = await supabase
      .from('comentarios')
      .select(`
        id,
        comentario,
        criado_em,
        usuario_id,
        usuarios (
          nome
        )
      `)
      .eq('evento_id', id)
      .order('criado_em', { ascending: false });

    if (!error) setComentarios(data);
  }

  async function excluirComentario(comentarioId) {
    const { error } = await supabase
      .from('comentarios')
      .delete()
      .eq('id', comentarioId);

    if (!error) carregarComentarios();
  }

  async function handleInscricao() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user?.id) return Alert.alert('Erro', 'Usuário não autenticado');

    const { data: inscricaoExistente } = await supabase
      .from('inscricao')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('eventos_id', id);

    if (inscricaoExistente.length > 0) return Alert.alert('Aviso', 'Você já está inscrito');

    await supabase.from('inscricao').insert({ usuario_id: user.id, eventos_id: id });
    await supabase.from('eventos').update({ vagas_disponiveis: vagasDisponiveis - 1 }).eq('id', id);



    setVagasDisponiveis(vagasDisponiveis - 1);
    setUsuarioInscrito(true);
    carregarDadosEvento();

    await adicionarEventoAoCalendario(titulo, local, data);
  }

  async function adicionarEventoAoCalendario(titulo, local, data) {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'O App precisa de acesso ao calendário.');
      return;
    }

    const defaultCalendarSource =
      Platform.OS === 'ios'
        ? await getDefaultCalendarSource()
        : { isLocalAccount: true, name: 'Expo-Calendar' };

    console.log('📅 Fonte do calendário:', defaultCalendarSource);

    const calendarId = await Calendar.createCalendarAsync({
      title: 'Eventos Guia IFFar',
      color: '#1C9B5E',
      entityType: Calendar.EntityTypes.EVENT,
      source: defaultCalendarSource,
      name: 'Eventos IFFar',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    console.log('✅ Calendário criado com ID:', calendarId);

    const eventoCriado = await Calendar.createEventAsync(calendarId, {
      title: titulo,
      location: local,
      startDate: new Date(data),
      endDate: new Date(new Date(data).getTime() + 2 * 60 * 60 * 1000),
      timeZone: 'America/Sao_Paulo',
      alarms: [{ relativeOffset: -30 }],
    });

    console.log('🗓️ Evento criado com ID:', eventoCriado);
    Alert.alert('Evento adicionado!', 'Evento salvo no seu calendário.');
  }


  async function getDefaultCalendarSource() {
    const calendars = await Calendar.getCalendarsAsync();
    const defaultCalendars = calendars.filter(each => each.source?.name === 'Default');
    return defaultCalendars.length > 0 ? defaultCalendars[0].source : calendars[0].source;
  }

  async function handleCancelarInscricao() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user?.id) return Alert.alert('Erro', 'Usuário não autenticado');

    await supabase.from('inscricao').delete().eq('usuario_id', user.id).eq('eventos_id', id);
    await supabase.from('eventos').update({ vagas_disponiveis: vagasDisponiveis + 1 }).eq('id', id);

    setVagasDisponiveis(vagasDisponiveis + 1);
    setUsuarioInscrito(false);
    carregarDadosEvento();
  }

  function formatarDataLegivel(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const nomeMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
      'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const mesesNome = nomeMeses[data.getMonth()];
    const ano = data.getFullYear();

    return `${dia} de ${mesesNome} de ${ano}`;

  }


  useEffect(() => {
    verificarCurtida();
    contarCurtidas();
    carregarComentarios();
    carregarFotosEvento();

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setUsuarioLogadoId(data.user.id);
    });

    async function verificarInscricao() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user?.id) return;

      const { data: inscricaoExistente } = await supabase
        .from('inscricao')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('eventos_id', id)
        .single();

      if (inscricaoExistente) setUsuarioInscrito(true);
    }

    verificarInscricao();
    carregarDadosEvento();
  }, []);

  const corBadge = usuarioInscrito || (!eventoEncerrado && vagasDisponiveis > 0) ? '#1C9B5E' : '#C4112F';
  const textoBadge = usuarioInscrito ? 'Inscrito' : eventoEncerrado ? 'Evento encerrado' : vagasDisponiveis > 0 ? 'Vagas Abertas' : 'Sem Vagas';

  return (
    <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.section}>
            <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={35} color="#1C9B5E" />
            </TouchableOpacity>
            <Text style={styles.tituloPrin}>Informações do Evento</Text>
            <View style={styles.Ghost} />
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <ScrollView keyboardShouldPersistTaps="handled">

              <View style={styles.header}>
                <Text style={{ color: '#1C9B5E', fontWeight: 'bold' }} variant="titleLarge">{titulo}</Text>
                <Badge style={[styles.badge, { backgroundColor: corBadge }]}>{textoBadge}</Badge>
              </View>

              <Divider style={styles.divisor} />
              <Text style={{ marginBottom: 10 }}><MaterialCommunityIcons name='pin' size={15} color={'#1C9B5E'} /> Local: {local}</Text>
              <MapView
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#1C9B5E' }}
                initialRegion={{
                  latitude: latitude || -27.0, // valor padrão caso venha null
                  longitude: longitude || -53.0,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01
                }}
              >
                <Marker coordinate={{ latitude: Number(latitude), longitude: Number(longitude) }} title={titulo} />

              </MapView>
              <Text><MaterialCommunityIcons name='calendar' size={15} color={'#1C9B5E'} /> Data: {formatarDataLegivel(data)}</Text>
              <Text><MaterialCommunityIcons name='account-group' size={15} color={'#1C9B5E'} /> Vagas disponíveis: {vagasDisponiveis} / {total_vagas}</Text>
              <Divider style={styles.divisor} />
              <Text variant="titleSmall">Descrição</Text>
              <Text variant="bodyMedium">{descricao}</Text>

              <Divider style={styles.divisor} />
              {eventoEncerrado ? (
                <Button disabled mode="contained" style={{ backgroundColor: '#C4112F' }}>Evento encerrado</Button>
              ) : usuarioInscrito ? (
                <Button mode="contained" onPress={handleCancelarInscricao} style={{ backgroundColor: '#C4112F' }}>Cancelar inscrição</Button>
              ) : vagasDisponiveis > 0 ? (
                <Button mode="contained" onPress={handleInscricao}>Inscrever-se</Button>
              ) : (
                <Button disabled mode="contained" style={{ backgroundColor: '#C4112F' }}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Vagas Esgotadas</Text>
                </Button>
              )}

              <Divider style={styles.divisor} />
              <View style={styles.cardImg}>
                {carregandoFotos ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', height: 250 }}>
                    <ActivityIndicator size="large" color="#1C9B5E" />
                  </View>
                ) : (
                  <FlatList
                    data={fotosEvento}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <Image source={{ uri: item.foto_url }} style={styles.imagem} />
                    )}
                  />
                )}
              </View>


              <View style={styles.social}>
                <TouchableOpacity onPress={alternarCurtida} style={styles.likeBtn}>
                  <MaterialCommunityIcons
                    name={curtido ? 'heart' : 'heart-outline'}
                    size={24}
                    color={curtido ? 'red' : 'black'}
                  />
                  <Text style={{ fontWeight: 'bold' }}>{totalCurtidas}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMostrarComentarios(!mostrarComentarios)} style={styles.likeBtn}>
                  <MaterialCommunityIcons name="comment-outline" size={24} color="black" />
                  <Text style={{ fontWeight: 'bold' }}>
                    {comentarios.length}
                  </Text>
                </TouchableOpacity>
              </View>

              {mostrarComentarios && (
                <>
                  <View style={styles.comentarioInputArea}>
                    <TextInput
                      style={styles.comentarioInput}
                      placeholder="Adicione um comentário..."
                      value={comentarioTexto}
                      onChangeText={setComentarioTexto}
                      onSubmitEditing={enviarComentario}
                    />
                    <TouchableOpacity onPress={enviarComentario}>
                      <MaterialCommunityIcons name="send" size={34} color="#1C9B5E" />
                    </TouchableOpacity>
                  </View>

                  {comentarios.map((item, idx) => (
                    <View key={idx} style={styles.comentario}>
                      <MaterialCommunityIcons name="account-circle" size={20} color="gray" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold' }}>
                          {item.usuarios?.nome || 'Usuário'}
                        </Text>
                        <Text>{item.comentario}</Text>
                      </View>

                      {item.usuario_id === usuarioLogadoId && (
                        <TouchableOpacity onPress={() => excluirComentario(item.id)}>
                          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#C4112F" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </>
              )}

            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  divisor: {
    marginVertical: 10,
    backgroundColor: 'green',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    color: 'white',
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'center',
    fontSize: 12,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  cardImg: {
    borderRadius: 8,
    height: 250,
    overflow: 'hidden'
  },
  imagem: {
    width: Dimensions.get('window').width - 40,
    height: 250,
    resizeMode: 'cover',
    marginRight: 10,
    borderRadius: 8
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  section: {
    fontSize: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50
  },
  tituloPrin: {
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 3,
    borderBottomColor: '#1C9B5E'
  },
  voltar: {
    marginBottom: 10,
    width: '25%'
  },
  Ghost: {
    width: '25%'
  },
  social: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  comentarioInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  comentarioInput: {
    marginTop: 15,
    marginBottom: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: '#1C9B5E',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
  },
  comentario: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f6f6f6',
    borderRadius: 6,
    gap: 8
  }
});
