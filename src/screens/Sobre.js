import React from 'react';
import { View, StyleSheet, Linking, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Sobre({navigation}) {
  return (
    <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>

      <SafeAreaView style={styles.container}>
        <View style={styles.titulo}>
          <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={35} color="#1C9B5E" />
          </TouchableOpacity>
          <Text style={styles.tituloPrin}>Sobre o App</Text>

          <View style={styles.Ghost}>

          </View>
        </View>

        <View style={styles.Two}>
          <Text style={styles.info}>
            Este aplicativo é um projeto acadêmico do
            curso de Sistemas para Internet – Campus Panambi.
          </Text>

          <Button
            style={styles.botao}
            mode="contained"
            onPress={() =>
              Linking.openURL('https://iffarroupilha.edu.br/panambi')}
          >
            Acessar site do campus
          </Button>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },

  Two: {
    marginTop: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  titulo: {
    fontSize: 20,
    marginBottom: 25,
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },

  tituloPrin: {
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 3,
    borderBottomColor: '#1C9B5E',
  },

  tituloRegis: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 3,
    borderBottomColor: '#1C9B5E',
    width: 156
  },

  voltar: {
    marginBottom: 10,
    width: 120
  },
  voltarTexto: {
    color: '#1C9B5E',
    fontSize: 35,
    fontWeight: 'bold',
  },

  Ghost: {
    width: 120
  },
  scrool: {
    width: '90%',
  },
  info: {
    marginBottom: '50%',
    textAlign: 'center'
  },
  botao: {
    marginTop: 20,
    width: 250
  },
});
