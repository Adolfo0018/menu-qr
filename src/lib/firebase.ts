import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Esta configuración identifica el proyecto y está hecha para ir en el navegador: no es secreta.
// Lo que protege los datos son las reglas de firestore.rules.
const configuracion = {
  apiKey: 'AIzaSyBe3S4RzTOKkbtonixne5hDbjYCQPB_xCw',
  authDomain: 'menu-4de7c.firebaseapp.com',
  projectId: 'menu-4de7c',
  storageBucket: 'menu-4de7c.firebasestorage.app',
  messagingSenderId: '257974302746',
  appId: '1:257974302746:web:463bd0d02d475791edf9a3',
}

const app = initializeApp(configuracion)

export const db = getFirestore(app)
export const auth = getAuth(app)
