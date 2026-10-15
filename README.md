# 🌟 Amigo Inteligente (AI Educativa para Crianças)

Um aplicativo móvel desenvolvido em **React Native / Expo** que funciona como um assistente virtual educativo, seguro e amigável para crianças. O aplicativo utiliza a API do **Google Gemini (Gemini Flash)** combinada com instruções de sistema personalizadas para garantir respostas adaptadas à idade e aos interesses da criança, contando também com **recursos de fala em voz alta (Text-to-Speech)**.

---

## ✨ Funcionalidades Principais

*   **Perfil Personalizado:** Configuração inicial de nome, idade e interesses da criança, salvos de forma segura no dispositivo (`AsyncStorage`).
*   **Filtro de Segurança e Conteúdo:** Instruções de sistema dinâmicas para que o Gemini responda de maneira simples, lúdica e totalmente protegida de conteúdos inadequados.
*   **Leitura por Voz (TTS):** As respostas geradas pela IA são lidas automaticamente em voz alta com a biblioteca `expo-speech`, auxiliando crianças em fase de alfabetização.
*   **Atalho para Microfone/Teclado:** Facilita o uso da digitação por voz nativa do teclado do celular.
*   **Interface Divertida e Colorida:** Layout moderno com temas alegres, avatares e balões de conversa estilizados.

---

## 🛠️ Tecnologias Utilizadas

*   [React Native](https://reactnative.dev/)
*   [Expo](https://expo.dev/)
*   [Expo Router](https://docs.expo.dev/router/introduction/)[cite: 2]
*   [Expo Speech (`expo-speech`)](https://docs.expo.dev/)
*   [AsyncStorage (`@react-native-async-storage/async-storage`)](https://github.com/react-native-async-storage/async-storage)

---

## ⚙️ Pré-requisitos e Instalação

Certifique-se de ter instalado em sua máquina:
*   [Node.js](https://nodejs.org/)
*   Gerenciador de pacotes (`npm` ou `yarn`)
*   Aplicativo **Expo Go** no seu celular (ou um emulador configurado).

### Passo a passo:

1. Clone o repositório ou abra a pasta do projeto no seu terminal.
2. Instale as dependências executando:
   ```bash
   npm install