import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { useEventos } from '../contexto/EventosContexto';
import { MaterialCommunityIcons } from '@expo/vector-icons';

if (typeof atob === 'undefined') {
    global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
}

export default function EditarEvento({ route, navigation }) {
    const evento = route.params;
    const { atualizarEventoAtualizado } = useEventos();

    const [titulo, setTitulo] = useState(evento.titulo);
    const [descricao, setDescricao] = useState(evento.descricao);
    const [data, setData] = useState(evento.data);
    const [local, setLocal] = useState(evento.local ?? ''); 
    const [localizacao, setLocalizacao] = useState(null);
    const [total_vagas, setTotalVagas] = useState(evento.total_vagas.toString());
    const [inscricao, setInscricao] = useState(evento.inscricao);
    const [fotos, setFotos] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [carregandoFoto, setCarregandoFoto] = useState(false);

    useEffect(() => {
        carregarFotosEvento();
    }, []);

    async function carregarFotosEvento() {
        const { data, error } = await supabase
            .from('fotos_evento')
            .select('id, foto_url')
            .eq('evento_id', evento.id);

        if (!error) {
            setFotos(data);
            atualizarEventoAtualizado({ ...evento, total_fotos: data.length });
        }
    }

    const selecionarImagem = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Permissão negada para acessar a galeria.');
            return;
        }

        const resultado = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 0.3,
        });

        if (!resultado.canceled) {
            for (let asset of resultado.assets) {
                await uploadFoto(asset.uri);
            }
        }
    };

    const uploadFoto = async (uri) => {
        setCarregandoFoto(true);
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const extensao = uri.split('.').pop() || 'jpg';
            const nomeImagem = `evento_${Date.now()}.${extensao}`;
            const base64Bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

            const { error: uploadError } = await supabase
                .storage
                .from('eventos')
                .upload(nomeImagem, base64Bytes, {
                    contentType: `image/${extensao}`,
                    upsert: true,
                });

            if (uploadError) {
                alert('Erro ao enviar a imagem.');
                return;
            }

            const resultadoUrl = supabase.storage.from('eventos').getPublicUrl(nomeImagem);
            const url = resultadoUrl?.data?.publicUrl;

            if (url) {
                await supabase.from('fotos_evento').insert({ evento_id: evento.id, foto_url: url });
                carregarFotosEvento();
            }
        } catch (err) {
            console.error(err);
            alert('Erro inesperado ao enviar a imagem.');
        } finally {
            setCarregandoFoto(false);
        }
    };

    async function excluirImagem(id, url) {
        const nomeArquivo = url.split('/').pop();
        await supabase.storage.from('eventos').remove([nomeArquivo]);
        await supabase.from('fotos_evento').delete().eq('id', id);
        carregarFotosEvento();
    }

    async function salvarEdicao() {
        console.log('🟡 salvarEdicao() chamada');
        setCarregando(true);
        setErro('');

        console.log('📌 Verificando campos...');
        console.log('📌 título:', titulo);
        console.log('📌 descrição:', descricao);
        console.log('📌 data:', data);
        console.log('📌 local:', local);
        console.log('📌 total_vagas:', total_vagas);

        if (!titulo.trim() || !descricao.trim() || !data.trim() || !total_vagas.trim()) {
            setErro('Preencha todos os campos obrigatórios.');
            console.log('⚠️ Campos obrigatórios não preenchidos');
            setCarregando(false);
            return;
        }

        const vagasTotais = Number(total_vagas.trim());
        if (isNaN(vagasTotais) || vagasTotais <= 0) {
            setErro('Digite um número válido de vagas.');
            console.log('❌ total_vagas inválido:', total_vagas);
            setCarregando(false);
            return;
        }

        try {
            console.log('📥 Buscando inscrições...');
            const { data: inscricoes, error: erroInscricoes } = await supabase
                .from('inscricao')
                .select('*')
                .eq('eventos_id', evento.id);

            if (erroInscricoes) {
                console.error('❌ Erro ao buscar inscrições:', erroInscricoes);
                throw new Error('Erro ao buscar inscrições.');
            }

            const totalInscritos = inscricoes?.length || 0;
            const vagasDisponiveis = Math.max(vagasTotais - totalInscritos, 0);
            console.log('🧮 Total inscritos:', totalInscritos);
            console.log('🧮 Vagas disponíveis:', vagasDisponiveis);

            const { error } = await supabase
                .from('eventos')
                .update({
                    titulo: titulo.trim(),
                    descricao: descricao.trim(),
                    data: data.trim(),
                    local: local.trim(),
                    total_vagas: vagasTotais,
                    vagas_disponiveis: vagasDisponiveis,
                    inscricao,
                    latitude: localizacao?.latitude,
                    longitude: localizacao?.longitude,
                })
                .eq('id', evento.id);

            setCarregando(false);

            if (error) {
                console.error('❌ Erro ao atualizar evento:', error);
                setErro('Erro ao salvar alterações.');
            } else {
                atualizarEventoAtualizado({
                    ...evento,
                    titulo: titulo.trim(),
                    descricao: descricao.trim(),
                    data: data.trim(),
                    latitude: localizacao?.latitude,
                    longitude: localizacao?.longitude,
                    total_vagas: vagasTotais,
                    vagas_disponiveis: vagasDisponiveis,
                    inscricao,
                });

                alert('Alterações salvas com sucesso.');
                console.log('✅ Alterações salvas com sucesso');

                setTimeout(() => {
                    navigation.goBack();
                }, 500);
            }
        } catch (err) {
            console.error('❌ Erro inesperado:', err);
            setErro('Erro ao salvar alterações.');
            setCarregando(false);
        }
    }


    async function buscarCoordenadas() {
        if (!local.trim()) {
            setErro('Digite um endereço válido.');
            return;
        }

        try {
            const resultados = await Location.geocodeAsync(local);
            if (resultados.length > 0) {
                const { latitude, longitude } = resultados[0];
                setLocalizacao({ latitude, longitude });
                setErro('');
            } else {
                setErro('Endereço não encontrado.');
            }
        } catch (error) {
            console.error('Erro ao geocodificar endereço:', error);
            setErro('Erro ao buscar o endereço no mapa.');
        }
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
            <SafeAreaView>
                <ScrollView contentContainerStyle={styles.container}>
                    <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
                        <Text style={styles.voltarTexto}>← Voltar</Text>
                    </TouchableOpacity>

                    <Text style={styles.titulo}>Editar Evento</Text>

                    <TextInput label="Título" value={titulo} onChangeText={setTitulo} mode="outlined" style={styles.input} theme={inputTheme} />
                    <TextInput label="Descrição" value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} mode="outlined" style={styles.input} theme={inputTheme} />
                    <TextInput label="Data (ex: 25/12/2025)" value={data} onChangeText={setData} mode="outlined" style={styles.input} theme={inputTheme} />
                    <TextInput label="Vagas" value={total_vagas} onChangeText={setTotalVagas} keyboardType="numeric" mode="outlined" style={styles.input} theme={inputTheme} />

                    <TextInput
                        label="Endereço"
                        value={local}
                        onChangeText={setLocal}
                        mode="outlined"
                        style={styles.input}
                        theme={inputTheme}
                    />

                    <Button
                        mode="outlined"
                        onPress={buscarCoordenadas}
                        style={{ marginBottom: 16 }}
                    >
                        Ver no Mapa
                    </Button>
                    {localizacao && (
                        <MapView
                            style={{ width: '100%', height: 200, marginBottom: 16, borderRadius: 10 }}
                            initialRegion={{
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

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        {fotos.length > 0 ? fotos.map(foto => (
                            <View key={foto.id} style={styles.cardImg}>
                                <Image source={{ uri: foto.foto_url }} style={styles.imagem} />
                                <TouchableOpacity style={styles.excluirBtn} onPress={() => excluirImagem(foto.id, foto.foto_url)}>
                                    <MaterialCommunityIcons name="close-circle" size={28} color="#C4112F" />
                                </TouchableOpacity>
                            </View>
                        )) : (
                            <Text style={{ textAlign: 'center', marginBottom: 10 }}>Nenhuma imagem atribuída a este evento.</Text>
                        )}
                    </ScrollView>

                    <Button mode="outlined" onPress={selecionarImagem} style={{ marginBottom: 10 }}>
                        Alterar Imagem
                    </Button>

                    {carregandoFoto && <ActivityIndicator animating />}
                    {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

                    {carregando ? (
                        <ActivityIndicator animating />
                    ) : (
                        <Button mode="contained" onPress={salvarEdicao} style={styles.botao}>
                            Salvar Alterações
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
        padding: 6,
    },
    erro: {
        color: 'red',
        textAlign: 'center',
    },
    radioContainer: {
        marginBottom: 20,
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
        borderColor: '#1C9B5E',
    },
    radioInner: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: '#1C9B5E',
    },
    radioLabel: {
        fontSize: 16,
        color: '#000',
    },
    voltar: {
        marginBottom: 10,
    },
    voltarTexto: {
        color: '#1C9B5E',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardImg: {
        borderRadius: 8,
        height: 300,
        width: 300,
        overflow: 'hidden',
        position: 'relative',
        marginRight: 10,
    },
    imagem: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    excluirBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'white',
        borderRadius: 15,
    },
});
