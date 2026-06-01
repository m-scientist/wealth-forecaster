import type { AppProps } from 'next/app';
import { FirebaseAuthProvider } from '../lib/FirebaseProvider';
import '../index.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <FirebaseAuthProvider>
      <Component {...pageProps} />
    </FirebaseAuthProvider>
  );
}

