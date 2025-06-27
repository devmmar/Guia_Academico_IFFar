import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Badge } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from '../config/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useState } from "react";

export default function EventosCard({
    id,
    titulo,
    data,
    local,
    foto_url,
    inscricao,
    vagas_disponiveis,
    total_vagas,
    onPress,
    onExcluir,
    onEditar,
    tipoUsuario,
    statusPersonalizado = '',           // ← NOVO: define o texto fixo do status
    podeCancelarInscricao = true,
}) {
    const [usuarioInscrito, setUsuarioInscrito] = useState(false);
    const [carregandoInscricao, setCarregandoInscricao] = useState(true);
    const vagasDisponiveis = vagas_disponiveis != null ? vagas_disponiveis : total_vagas;

    // Verificação de data encerrada
    const eventoEncerrado = new Date(data) < new Date();

    // Determinar cor do badge
    const corBadge = (() => {
        if (statusPersonalizado) {
            if (statusPersonalizado.toLowerCase().includes('ativo')) return '#1C9B5E'; // verde
            return '#C4112F'; // vermelho para encerrado ou removido
        }

        if (inscricao === false) return '#C4112F';
        if (eventoEncerrado) return '#C4112F';
        return '#1C9B5E';
    })();


    // Texto do badge
    const textoBadge = statusPersonalizado
        ? statusPersonalizado
        : carregandoInscricao
            ? '...'
            : eventoEncerrado
                ? 'Evento encerrado'
                : inscricao
                    ? usuarioInscrito
                        ? 'Inscrito'
                        : vagasDisponiveis > 0
                            ? 'Vagas Abertas'
                            : 'Sem Vagas'
                    : 'Inscrições encerradas';

    function formatarDataLegivel(dataString) {
        if (!dataString) return '';
        const data = new Date(dataString);
        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mesesNome = String(data.getMonth() + 1 ).padStart(2, '0');
        const ano = data.getFullYear();

        return `${dia}/${mesesNome}/${ano}`;

    }


    useFocusEffect(
        useCallback(() => {
            async function verificarInscricao() {
                if (!id) {
                    setCarregandoInscricao(false);
                    return;
                }

                const { data: userData } = await supabase.auth.getUser();
                const user = userData?.user;

                if (!user?.id) {
                    setCarregandoInscricao(false);
                    return;
                }

                const { data: inscricaoExistente } = await supabase
                    .from('inscricao')
                    .select('*')
                    .eq('usuario_id', user.id)
                    .eq('eventos_id', parseInt(id));

                setUsuarioInscrito(inscricaoExistente && inscricaoExistente.length > 0);
                setCarregandoInscricao(false);
            }

            verificarInscricao();
        }, [id])
    );

    return (
        <Card style={styles.card} onPress={onPress}>
            <Card.Content style={styles.content}>
                <View style={styles.header}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1C9B5E' }}>{titulo}</Text>
                    <Badge style={[styles.badge, { backgroundColor: corBadge }]}>
                        {textoBadge}
                    </Badge>
                </View>

                <View style={styles.section}>
                    <View style={styles.GhostOne}>
                        <Text>
                            <MaterialCommunityIcons name='calendar' size={15} color={'#1C9B5E'} />
                            {' '}Data: {formatarDataLegivel(data)}
                        </Text>
                        <Text>
                            <MaterialCommunityIcons name='pin' size={15} color={'#1C9B5E'} />
                            {' '}Local: {local}
                        </Text>
                        <Text>
                            <MaterialCommunityIcons name='account-group' size={15} color={'#1C9B5E'} />
                            {' '}Vagas: {vagasDisponiveis} / {total_vagas}
                        </Text>
                    </View>


                    <View style={styles.GhostTree}>
                        {tipoUsuario === 'admin' && (
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <TouchableOpacity onPress={onEditar}>
                                    <MaterialCommunityIcons name="pencil" size={24} color="#1C9B5E" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={onExcluir}>
                                    <MaterialCommunityIcons name="trash-can" size={24} color="#C4112F" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 15,
        backgroundColor: '#dfdfdf',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1C9B5E',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badge: {
        color: 'white',
        paddingHorizontal: 20,
        borderRadius: 8,
        fontSize: 12,
        alignSelf: 'center',
    },
    content: {
        borderRadius: 8,
    },
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 70,
        marginTop: 20
    },

    GhostOne: {
        width: '50%'
    },

    GhostTree: {
        width: '50%'
    }
});
