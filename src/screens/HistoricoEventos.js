import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useUsuario } from '../contexto/UsuarioContexto';
import { supabase } from '../config/supabase';
import EventosCard from './EventosCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HistoricoEventos({ navigation }) {
    const { usuario } = useUsuario();
    const [eventos, setEventos] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        buscarEventosInscritos();
    }, []);

    async function buscarEventosInscritos() {
        setCarregando(true);

        const { data: inscricoes, error } = await supabase
            .from('inscricao')
            .select(`
        eventos_id,
        created_at,
        eventos (
          id,
          titulo,
          descricao,
          data,
          local,
          vagas_disponiveis,
          total_vagas,
          ativo
        )
      `)
            .eq('usuario_id', usuario.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar inscrições:', error);
            setCarregando(false);
            return;
        }

        if (inscricoes) {
            const eventosFormatados = inscricoes.map((inscricao) => {
                if (inscricao.eventos) {
                    const status = inscricao.eventos.ativo === false ? 'encerrado' : 'ativo';

                    return {
                        ...inscricao.eventos,
                        chave_unica: `evento_${inscricao.eventos.id}_${inscricao.created_at}`,
                        status: status,
                        statusPersonalizado:
                            status === 'encerrado' ? 'Evento encerrado' : 'Evento ativo',
                        podeCancelarInscricao: status === 'ativo',
                    };
                }

                return {
                    id: `excluido_${inscricao.eventos_id}`,
                    titulo: '(Evento excluído)',
                    descricao: 'Este evento foi removido do sistema.',
                    data: '',
                    local: '',
                    vagas_disponiveis: 0,
                    total_vagas: 0,
                    chave_unica: `excluido_${inscricao.eventos_id}_${inscricao.created_at}`,
                    status: 'excluido',
                    statusPersonalizado: 'Removido do sistema',
                    podeCancelarInscricao: false,
                };
            });

            setEventos(eventosFormatados);
        }

        setCarregando(false);
    }

    return (
        <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <View style={styles.titulo}>
                    <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={35} color="#1C9B5E" />
                    </TouchableOpacity>
                    <Text style={styles.tituloPrin}>Histórico</Text>

                    <View style={styles.Ghost}>

                    </View>
                </View>
                <ScrollView style={styles.scrool}>
                    {carregando && <ActivityIndicator />}
                    {!carregando && eventos.length === 0 && (
                        <Text style={{ marginTop: 20 }}>
                            Você ainda não se inscreveu em nenhum evento.
                        </Text>
                    )}

                    {eventos.map((evento) => (
                        <EventosCard
                            key={evento.chave_unica}
                            {...evento}
                            tipoUsuario="usuario"
                            mostrarBotoes={false}
                            statusPersonalizado={evento.statusPersonalizado}
                            podeCancelarInscricao={evento.podeCancelarInscricao}
                        />
                    ))}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        width: '100%'
    },
    scrool: {
        width: '90%',
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
    }
});
