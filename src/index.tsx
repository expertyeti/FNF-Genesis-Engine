import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import NativeScreen from './app/native';
import WebScreen from './app/web';

// Selecciona el contenedor adecuado. 
// PC con Neutralino no pasará por aquí, ejecutará el motor puro.
const App = Platform.OS === 'web' ? WebScreen : NativeScreen;

registerRootComponent(App);