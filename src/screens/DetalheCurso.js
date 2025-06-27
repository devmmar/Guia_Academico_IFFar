import { ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { Card, Divider, Text, Button, Badge } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DetalheCurso({ route, navigation }) {
  const {
    nome,
    modalidade,
    nivel,
    unidade,
    duracao,
    turno,
    descricao
  } = route.params;

  return (
    <LinearGradient colors={['#dff5eb', '#ffffff']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
          <View style={styles.section}>
            <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={30} color="#1C9B5E" />
            </TouchableOpacity>
            <Text style={styles.tituloPrin}>Detalhe do Curso</Text>
            <View style={styles.Ghost} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                <View style={styles.header}>
                  <Text variant="titleLarge" style={styles.titulo}>{nome}</Text>
                  <Badge style={styles.badge}>{nivel}</Badge>
                </View>

                <Divider style={styles.divisor} />

                <Text variant="bodyMedium" style={styles.info}>
                  <MaterialCommunityIcons name="laptop" size={16} color="#1C9B5E" /> Modalidade: {modalidade}{"\n"}
                  <MaterialCommunityIcons name="school" size={16} color="#1C9B5E" /> Unidade: {unidade}{"\n"}
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#1C9B5E" /> Duração: {duracao}{"\n"}
                  <MaterialCommunityIcons name="weather-night" size={16} color="#1C9B5E" /> Turno: {turno}
                </Text>

                <Divider style={styles.divisor} />

                <Text variant="titleSmall" style={styles.tituloSecao}>Descrição</Text>
                <Text variant="bodyMedium">{descricao}</Text>
          </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    height: 60,
    marginTop: 30,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voltar: {
    width: 50,
  },
  Ghost: {
    width: 50,
  },
  tituloPrin: {
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#1C9B5E',
    textAlign: 'center',
  },
  card: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#1C9B5E",
    borderRadius: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#1C9B5E',
    color: 'white',
    paddingHorizontal: 10,
    fontSize: 12,
    borderRadius: 6,
  },
  divisor: {
    marginVertical: 10,
    backgroundColor: 'green',
  },
  info: {
    marginBottom: 10,
    lineHeight: 22,
  },
  tituloSecao: {
    marginTop: 10,
    marginBottom: 4,
    fontWeight: 'bold',
    color: '#1C9B5E',
  },
  titulo: {
    fontWeight: 'bold',
    color: '#1C9B5E',
  },
  botaoVoltar: {
    marginTop: 20,
    borderColor: '#1C9B5E',
  },
});
