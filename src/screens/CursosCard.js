import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Title, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CursosCard({ nome, nivel, modalidade, duracao, turno, onPress, onEditar, onExcluir, tipoUsuario }) {
    return (
        <Card style={styles.card} onPress={onPress}>
            <Card.Content style={styles.content}>
                <View style={styles.header}>
                    <Title style={styles.titulo}>{nivel}</Title>

                    {tipoUsuario === 'admin' && (
                        <View style={styles.icones}>
                            <TouchableOpacity onPress={onEditar}>
                                <MaterialCommunityIcons name="pencil" size={22} color="#1C9B5E" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onExcluir}>
                                <MaterialCommunityIcons name="trash-can" size={22} color="#C4112F" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.info}>
                    <Text><MaterialCommunityIcons name="book" size={16} color="#1C9B5E" /> Nome: {nome}</Text>
                    <Text><MaterialCommunityIcons name="clock-outline" size={16} color="#1C9B5E" /> Duração: {duracao}</Text>
                    <Text><MaterialCommunityIcons name="weather-night" size={16} color="#1C9B5E" /> Turno: {turno}</Text>
                    <Text><MaterialCommunityIcons name="laptop" size={16} color="#1C9B5E" /> Modalidade: {modalidade}</Text>
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
    content: {
        borderRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titulo: {
        color: '#1C9B5E',
        fontWeight: 'bold',
        fontSize: 18,
    },
    icones: {
        flexDirection: 'row',
        gap: 15,
    },
    info: {
        marginTop: 10,
        gap: 5,
    },
});
