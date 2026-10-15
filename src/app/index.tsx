import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

interface Mensagem {
  autor: 'usuario' | 'gemini';
  texto: string;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function App() {
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [interesses, setInteresses] = useState('');
  const [perfilSalvo, setPerfilSalvo] = useState(false);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  const [mensagem, setMensagem] = useState('');
  const [historico, setHistorico] = useState<Mensagem[]>([]);
  const [carregandoResposta, setCarregandoResposta] = useState(false);
  const [falando, setFalando] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    carregarPerfilSalvo();
  }, []);

  const carregarPerfilSalvo = async () => {
    try {
      const perfilJson = await AsyncStorage.getItem('@perfil_crianca');
      if (perfilJson !== null) {
        const perfil = JSON.parse(perfilJson);
        setNome(perfil.nome);
        setIdade(perfil.idade);
        setInteresses(perfil.interesses || '');
        setPerfilSalvo(true);
      }
    } catch (e) {
      console.error('Erro ao carregar perfil:', e);
    } finally {
      setCarregandoPerfil(false);
    }
  };

  const salvarPerfil = async () => {
    if (!nome.trim() || !idade.trim()) {
      Alert.alert('Atenção 🌟', 'Por favor, preencha o nome e a idade da criança.');
      return;
    }

    const perfil = { nome, idade, interesses };
    try {
      await AsyncStorage.setItem('@perfil_crianca', JSON.stringify(perfil));
      setPerfilSalvo(true);
    } catch (e) {
      Alert.alert('Erro 😅', 'Não foi possível salvar o perfil.');
    }
  };

  const editarPerfil = async () => {
    Speech.stop();
    setPerfilSalvo(false);
  };

  const falarTexto = (texto: string) => {
    Speech.stop();
    setFalando(true);
    Speech.speak(texto, {
      language: 'pt-BR',
      pitch: 1.1,
      rate: 0.9,
      onDone: () => setFalando(false),
      onStopped: () => setFalando(false),
      onError: () => setFalando(false),
    });
  };

  const pararAudio = () => {
    Speech.stop();
    setFalando(false);
  };

  const acionarVozTeclado = () => {
    pararAudio();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const enviarMensagem = async (textoInput?: string) => {
    const textoParaEnviar = textoInput || mensagem;
    if (!textoParaEnviar.trim() || carregandoResposta) return;

    if (!GEMINI_API_KEY) {
      Alert.alert('Erro 🔑', 'Chave EXPO_PUBLIC_GEMINI_API_KEY não encontrada no arquivo .env.');
      return;
    }

    pararAudio();
    setMensagem('');
    Keyboard.dismiss();

    const novoHistorico: Mensagem[] = [...historico, { autor: 'usuario', texto: textoParaEnviar.trim() }];
    setHistorico(novoHistorico);
    setCarregandoResposta(true);

    try {
      const systemInstruction = `
        Você é um assistente virtual educativo, seguro, amigável e protetor para crianças.
        Você está conversando com ${nome}, que tem ${idade} anos.
        ${interesses ? `Interesses informados: ${interesses}.` : ''}

        REGRAS IMPERATIVAS:
        1. Responda em português simples, amigável e educativo.
        2. Mantenha frases relativamente curtas e diretas para que possam ser ouvidas em voz alta por uma criança.
        3. Nunca aborde conteúdos violentos, adultos ou inadequados para ${idade} anos.
      `;

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY.trim(),
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                parts: [{ text: textoParaEnviar.trim() }],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || `Erro HTTP ${response.status}`);
      }

      const respostaIA =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui entender, pode repetir?';

      setHistorico([...novoHistorico, { autor: 'gemini', texto: respostaIA }]);
      falarTexto(respostaIA);
    } catch (error: any) {
      console.error('Erro na chamada do Gemini:', error);
      Alert.alert(
        'Erro na Conexão 🌐',
        error?.message || 'Não foi possível se conectar com o Gemini. Verifique sua chave API.'
      );
    } finally {
      setCarregandoResposta(false);
    }
  };

  if (carregandoPerfil) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!perfilSalvo) {
    return (
      <SafeAreaView style={styles.safeAreaConfig}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.topoConfigIcone}>
            <Text style={styles.emojiDecoracao}>🎨</Text>
            <Text style={styles.tituloHeader}>Configurar Perfil</Text>
          </View>

          <Text style={styles.subtituloHeader}>
            Defina quem usará o aplicativo para adaptarmos as respostas e a segurança! ✨
          </Text>

          <View style={styles.cardForm}>
            <Text style={styles.label}>👤 Nome da criança:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Sofia"
              placeholderTextColor="#999"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>🎂 Idade:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 7"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={idade}
              onChangeText={setIdade}
            />

            <Text style={styles.label}>🎈 Interesses (Opcional):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Desenhos, robôs, animais..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={interesses}
              onChangeText={setInteresses}
            />

            <TouchableOpacity style={styles.botaoSalvar} onPress={salvarPerfil}>
              <Text style={styles.textoBotao}>Salvar e Iniciar Chat 🚀</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Barra Superior Divertida */}
        <View style={styles.topBar}>
          <View style={styles.perfilInfoContainer}>
            <View style={styles.avatarCrianca}>
              <Text style={styles.avatarEmoji}>🧒</Text>
            </View>
            <View>
              <Text style={styles.nomePerfil}>{nome}</Text>
              <Text style={styles.idadePerfil}>🌟 {idade} anos</Text>
            </View>
          </View>

          <View style={styles.acoesBarraTop}>
            {falando && (
              <TouchableOpacity style={styles.botaoPararAudio} onPress={pararAudio}>
                <Text style={styles.textoPararAudio}>⏹ Parar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.botaoEditar} onPress={editarPerfil}>
              <Text style={styles.textoEditar}>⚙️ Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Área de Chat */}
        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          {historico.length === 0 ? (
            <View style={styles.boasVindas}>
              <Text style={styles.emojiBoasVindas}>🤖👋</Text>
              <Text style={styles.textoBoasVindas}>Olá, {nome}!</Text>
              <Text style={styles.subBoasVindas}>
                Toque no botão verde abaixo para falar comigo usando a sua voz ou digite sua pergunta!
              </Text>
            </View>
          ) : (
            historico.map((item: Mensagem, index: number) => (
              <View
                key={index}
                style={[
                  styles.balaoWrapper,
                  item.autor === 'usuario' ? styles.balaoWrapperUsuario : styles.balaoWrapperGemini,
                ]}
              >
                <View style={styles.avatarMensagem}>
                  <Text style={styles.avatarIcone}>{item.autor === 'usuario' ? '🧒' : '🤖'}</Text>
                </View>

                <View
                  style={[
                    styles.balao,
                    item.autor === 'usuario' ? styles.balaoUsuario : styles.balaoGemini,
                  ]}
                >
                  <Text
                    style={[
                      styles.textoBalao,
                      item.autor === 'usuario' ? styles.textoUsuario : styles.textoGemini,
                    ]}
                  >
                    {item.texto}
                  </Text>

                  {item.autor === 'gemini' && (
                    <TouchableOpacity style={styles.botaoOuvirNovamente} onPress={() => falarTexto(item.texto)}>
                      <Text style={styles.textoOuvirNovamente}>🔊 Escutar de novo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          {carregandoResposta && (
            <View style={[styles.balaoWrapper, styles.balaoWrapperGemini]}>
              <View style={styles.avatarMensagem}>
                <Text style={styles.avatarIcone}>🤖</Text>
              </View>
              <View style={[styles.balao, styles.balaoGemini, styles.balaoCarregando]}>
                <ActivityIndicator size="small" color="#FF6B6B" />
                <Text style={styles.textoCarregando}>Pensando...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Área dos Botões e Input */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.botaoMicrofoneGrande} onPress={acionarVozTeclado}>
            <Text style={styles.textoIconeMicrofone}>🎤</Text>
            <Text style={styles.textoBotaoMicrofone}>FALAR COM A VOZ DO TECLADO</Text>
          </TouchableOpacity>

          <View style={styles.campoTextoContainer}>
            <TextInput
              ref={inputRef}
              style={styles.inputChat}
              placeholder="Digite ou use o microfone..."
              placeholderTextColor="#999"
              value={mensagem}
              onChangeText={setMensagem}
            />
            <TouchableOpacity
              style={[styles.botaoEnviar, carregandoResposta && styles.botaoDesabilitado]}
              onPress={() => enviarMensagem()}
              disabled={carregandoResposta}
            >
              <Text style={styles.textoEnviar}>🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaConfig: { flex: 1, backgroundColor: '#E0F7FA' },
  safeArea: { flex: 1, backgroundColor: '#cb85fa' },
  container: { flex: 1, backgroundColor: '#F4F7FE' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FE' },
  
  // Configuração inicial
  formContainer: { padding: 24, alignItems: 'center' },
  topoConfigIcone: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  emojiDecoracao: { fontSize: 32, marginRight: 8 },
  tituloHeader: { fontSize: 26, fontWeight: 'bold', color: '#102A43' },
  subtituloHeader: { fontSize: 15, color: '#486581', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  cardForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  label: { fontSize: 15, fontWeight: '700', color: '#334E68', marginBottom: 8 },
  input: {
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#102A43',
    marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  botaoSalvar: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  textoBotao: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },

  // Barra Superior
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#cb85fa',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  perfilInfoContainer: { flexDirection: 'row', alignItems: 'center' },
  avatarCrianca: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarEmoji: { fontSize: 22 },
  nomePerfil: { fontSize: 18, fontWeight: 'bold', color: '#102A43' },
  idadePerfil: { fontSize: 13, color: '#486581', fontWeight: '600' },
  acoesBarraTop: { flexDirection: 'row', alignItems: 'center' },
  botaoPararAudio: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  textoPararAudio: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  botaoEditar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  textoEditar: { color: '#102A43', fontWeight: '700', fontSize: 13 },

  // Área do Chat
  chatArea: { flex: 1, backgroundColor: '#F4F7FE' },
  chatContent: { padding: 16, paddingBottom: 20 },
  boasVindas: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emojiBoasVindas: { fontSize: 50, marginBottom: 12 },
  textoBoasVindas: { fontSize: 24, fontWeight: 'bold', color: '#102A43', marginBottom: 8 },
  subBoasVindas: { fontSize: 15, color: '#486581', textAlign: 'center', lineHeight: 22 },

  // Balões de Mensagens
  balaoWrapper: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  balaoWrapperUsuario: { justifyContent: 'flex-end' },
  balaoWrapperGemini: { justifyContent: 'flex-start' },
  avatarMensagem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  avatarIcone: { fontSize: 18 },
  balao: { padding: 14, borderRadius: 20, maxWidth: '78%' },
  balaoUsuario: {
    backgroundColor: '#ff7f4d',
    borderBottomRightRadius: 4,
  },
  balaoGemini: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  balaoCarregando: { flexDirection: 'row', alignItems: 'center' },
  textoCarregando: { marginLeft: 8, color: '#FF6B6B', fontWeight: '600' },
  textoBalao: { fontSize: 16, lineHeight: 22 },
  textoUsuario: { color: '#FFFFFF', fontWeight: '500' },
  textoGemini: { color: '#102A43' },
  botaoOuvirNovamente: {
    marginTop: 8,
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  textoOuvirNovamente: { color: '#4D96FF', fontSize: 12, fontWeight: 'bold' },

  // Área Inferior de Input
  inputArea: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },
  botaoMicrofoneGrande: {
    flexDirection: 'row',
    backgroundColor: '#e2eb93',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#06D6A0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  textoIconeMicrofone: { fontSize: 20, marginRight: 8 },
  textoBotaoMicrofone: { color: '#ca068f', fontSize: 14, fontWeight: 'bold' },
  campoTextoContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  inputChat: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#102A43',
    marginRight: 8,
  },
  botaoEnviar: {
    backgroundColor: '#FF6B6B',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoDesabilitado: { backgroundColor: '#FFB5B5' },
  textoEnviar: { fontSize: 18 },
});