import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { Tema } from './src/config/Tema';
import Home from './src/screens/Home';
import Cursos from './src/screens/Cursos';
import Eventos from './src/screens/Eventos';
import DetalheCurso from './src/screens/DetalheCurso';
import DetalheEventos from './src/screens/DetalheEvento';
import Login from './src/screens/Login';
import Loading from './src/screens/Loading';
import Cadastro from './src/screens/Cadastro';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UsuarioProvider } from './src/contexto/UsuarioContexto';
import { EventosProvider } from './src/contexto/EventosContexto';
import { CursosProvider } from './src/contexto/CursosContexto'; // ✅ Importar provider
import NovoEvento from './src/screens/NovoEvento';
import NovoCurso from './src/screens/NovoCurso';
import Perfil from './src/screens/Perfil';
import Sobre from './src/screens/Sobre';
import EditarEvento from './src/screens/EditarEvento';
import HistoricoEventos from './src/screens/HistoricoEventos';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarStyle: {
          backgroundColor: '#1C9B5E',
          borderTopColor: 'transparent',
          height: 100,
        },
        headerShown: false
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ size }) => (
            <MaterialCommunityIcons name="home" size={size} color='#ffffff' />
          ),
          tabBarLabelStyle: { color: '#ffffff' },
        }}
      />
      <Tab.Screen name="Cursos" component={Cursos} options={{
        tabBarIcon: ({ size }) => (
          <MaterialCommunityIcons name="book" size={size} color='#ffffff' />
        ),
        tabBarLabelStyle: { color: '#ffffff' },
      }} />
      <Tab.Screen name="Eventos" component={Eventos} options={{
        tabBarIcon: ({ size }) => (
          <MaterialCommunityIcons name="calendar" size={size} color='#ffffff' />
        ),
        tabBarLabelStyle: { color: '#ffffff' },
      }} />
      <Tab.Screen name="Perfil" component={Perfil} options={{
        tabBarIcon: ({ size }) => (
          <MaterialCommunityIcons name="account-settings" size={size} color='#ffffff' />
        ),
        tabBarLabelStyle: { color: '#ffffff' },
      }} />

    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={Tema}>
      <UsuarioProvider>
        <EventosProvider>
          <CursosProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Loading" component={Loading} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Tabs" component={Tabs} />
                <Stack.Screen name="DetalheCurso" component={DetalheCurso} />
                <Stack.Screen name="DetalheEventos" component={DetalheEventos} />
                <Stack.Screen name="Cadastro" component={Cadastro} />
                <Stack.Screen name="NovoEvento" component={NovoEvento} />
                <Stack.Screen name="NovoCurso" component={NovoCurso} />
                <Stack.Screen name="EditarEvento" component={EditarEvento} />
                <Stack.Screen name="HistoricoEventos" component={HistoricoEventos} />
                <Stack.Screen name="Sobre" component={Sobre} />
              </Stack.Navigator>
            </NavigationContainer>
          </CursosProvider>
        </EventosProvider>
      </UsuarioProvider>
    </PaperProvider>
  );
}
