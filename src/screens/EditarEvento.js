import React, { useState, useEffect } from 'react';
import {
    View, StyleSheet, ScrollView, Image, TouchableOpacity, KeyboardAvoidingView,
    Platform,
} from 'react-native';
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

export default function EditarEvento({ route, navigation }) {
    const evento = route.params;
    const { atualizarEventoAtualizado } = useEventos();

    const [titulo, setTitulo] = useState(evento.titulo);
    const [descricao, setDescricao] = useState(evento.descricao);
    const [data, setData] = useState(() => {
        if (!evento.data) return '';
        const partes = evento.data.split('-'); // yyyy-mm-dd
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return evento.data;
    });

    const [local, setLocal] = useState(evento.local ?? '');
    const [localizacao, setLocalizacao] = useState(null);
    const [total_vagas, setTotalVagas] = useState(evento.total_vagas.toString());
    const [inscricao, setInscricao] = useState(evento.inscricao);
    const [fotos, setFotos] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [carregandoFoto, setCarregandoFoto] = useState(false);
    const [sugestoes, setSugestoes] = useState([]);
    const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

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
        setCarregando(true);
        setErro('');

        const dataISO = formatarDataParaISO(data.trim());

        if (!titulo.trim() || !descricao.trim() || !dataISO || !total_vagas.trim()) {
            setErro('Preencha todos os campos obrigatórios.');
            setCarregando(false);
            return;
        }

        const vagasTotais = Number(total_vagas.trim());
        if (isNaN(vagasTotais) || vagasTotais <= 0) {
            setErro('Digite um número válido de vagas.');
            setCarregando(false);
            return;
        }

        try {
            const { data: inscricoes, error: erroInscricoes } = await supabase
                .from('inscricao')
                .select('*')
                .eq('eventos_id', evento.id);

            if (erroInscricoes) throw new Error('Erro ao buscar inscrições.');

            const totalInscritos = inscricoes?.length || 0;
            const vagasDisponiveis = Math.max(vagasTotais - totalInscritos, 0);

            const { error } = await supabase
                .from('eventos')
                .update({
                    titulo: titulo.trim(),
                    descricao: descricao.trim(),
                    data: dataISO,
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
                setTimeout(() => navigation.goBack(), 500);
            }
        } catch (err) {
            console.error('Erro inesperado:', err);
            setErro('Erro ao salvar alterações.');
            setCarregando(false);
        }
    }

    function formatarEnderecoCompleto(displayName) {
        if (!displayName) return '';
        const partes = displayName.split(',').map(p => p.trim());
        const ruaNumero = partes[0] || '';
        const bairro = partes[1] || '';
        const cidade = partes[2] || '';
        return [ruaNumero, bairro, cidade].filter(Boolean).join(', ');
    }

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


    useEffect(() => {
        if (evento.latitude && evento.longitude) {
            setLocalizacao({
                latitude: evento.latitude,
                longitude: evento.longitude
            });
        } else {
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErro('Permissão para acesso à localização foi negada');
                    return;
                }
                let location = await Location.getCurrentPositionAsync({});
                setLocalizacao({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });
            })();
        }
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
                            <Text style={styles.tituloPrin}>Editar Evento</Text>

                            <View style={styles.Ghost}>

                            </View>
                        </View>
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
                            style={styles.input}
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
        justifyContent: 'space-between',
    },
    tituloPrin: {
        fontSize: 20,
        fontWeight: 'bold',
        borderBottomWidth: 3,
        borderBottomColor: '#1C9B5E',
    },
    voltar: {
        marginBottom: 10,
        width: 100
    },
    Ghost: {
        width: 40,
    },
    input: {
        marginBottom: 16,
        color: 'black',
        borderRadius: 20,
    },
    botao: {
        borderRadius: 25,
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
    listaSugestoes: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 12,
        paddingVertical: 4,
        zIndex: 100,
    },
    sugestaoItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
});
