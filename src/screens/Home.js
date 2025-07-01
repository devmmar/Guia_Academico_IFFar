import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../config/supabase';
import { useUsuario } from '../contexto/UsuarioContexto';

export default function Home({ navigation }) {
    const { usuario, perfil, setUsuario, setPerfil, carregando } = useUsuario();

    async function sair() {
        await supabase.auth.signOut();
        setUsuario(null);
        setPerfil(null);
        navigation.replace('Login');
    }

    if (carregando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>
            <View style={styles.container}>
                <Image
                    style={styles.img}
                    source={{
                        uri: perfil?.foto_url
                            ? perfil.foto_url
                            : 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png', // imagem padrão
                    }}
                />

                <Text style={styles.titulo}>Olá, {perfil?.nome || 'Visitante'}</Text>
                <Text style={styles.subtitulo}>Guia Acadêmico IFFar</Text>

                <Button mode="contained" style={styles.botao} onPress={() => navigation.navigate('Cursos')}>
                    Ver Cursos
                </Button>

                <Button mode="contained" style={styles.botao} onPress={() => navigation.navigate('Eventos')}>
                    Ver Eventos
                </Button>

                <Button
                    mode="outlined"
                    style={styles.botao}
                    onPress={() => navigation.navigate('Sobre')}
                >
                    Sobre o app
                </Button>

                <Button mode="text" style={styles.sair} onPress={sair}>
                    Sair
                </Button>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1C9B5E',
        textAlign: 'center',
    },
    subtitulo: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 30,
    },
    botao: {
        marginVertical: 10,
    },
    sair: {
        marginTop: 20,
        alignSelf: 'center',
    },
    img: {
        width: 200,
        height: 200,
        borderRadius: 100,
        alignSelf: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#2e7d32',
    },
});
