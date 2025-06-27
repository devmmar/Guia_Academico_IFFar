import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const Tema = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1C9B5E',       // verde principal
    secondary: '#C4112F',     // vermelho destaque
    background: '#F4F4F4',    // fundo leve
    surface: '#FFFFFF',
    onSurface: '#000000',
    text: '#000000',
    outline: '#CCCCCC',
  },
};
