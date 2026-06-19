import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Vibration, Alert, Platform, ScrollView, ActivityIndicator, Share } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

const Stack = createNativeStackNavigator();

const calcularResultadosBFP = (respostas) => {
  const somar = (itens) => itens.reduce((acc, item) => acc + (parseInt(respostas[item]) || 0), 0);

  const EB_N1 = somar([55, 60, 73, 75, 79, 82, 89, 110, 118]) / 9;
  const EB_N2 = somar([25, 51, 65, 77, 86, 102]) / 6;
  const EB_N3 = somar([13, 22, 35, 37, 95, 100]) / 6;
  const EB_N4 = (somar([29, 40, 48, 70, 106, 121, 124]) + (8 - somar([16]))) / 8;
  const N_Geral = (EB_N1 + EB_N2 + EB_N3 + EB_N4) / 4;

  const EB_E1 = (somar([97, 105, 120]) + (24 - somar([17, 38, 66]))) / 6;
  const EB_E2 = somar([3, 5, 14, 78, 93, 99, 111]) / 7;
  const EB_E3 = somar([21, 26, 32, 108, 117]) / 5;
  const EB_E4 = somar([8, 11, 47, 50, 52, 71, 90]) / 7;
  const E_Geral = (EB_E1 + EB_E2 + EB_E3 + EB_E4) / 4;

  const EB_S1 = somar([2, 4, 12, 15, 20, 43, 46, 61, 92, 96, 104, 125]) / 12;
  const EB_S2 = (somar([76, 109]) + (48 - somar([18, 24, 27, 63, 87, 107]))) / 8;
  const EB_S3 = (somar([7, 68]) + (48 - somar([10, 30, 39, 57, 98, 119]))) / 8;
  const S_Geral = (EB_S1 + EB_S2 + EB_S3) / 3;

  const EB_R1 = somar([28, 41, 58, 64, 67, 72, 83, 85, 91, 122]) / 10;
  const EB_R2 = (somar([9, 45, 101]) + (8 - somar([19]))) / 4;
  const EB_R3 = somar([34, 54, 80, 103, 112, 114, 116]) / 7;
  const R_Geral = (EB_R1 + EB_R2 + EB_R3) / 3;

  const EB_A1 = (somar([36, 53, 88]) + (56 - somar([23, 33, 42, 56, 62, 81, 115]))) / 10;
  const EB_A2 = (somar([31, 59, 69, 74, 123, 126]) + (8 - somar([1]))) / 7;
  const EB_A3 = (somar([6, 44, 49, 94, 113]) + (8 - somar([84]))) / 6;
  const A_Geral = (EB_A1 + EB_A2 + EB_A3) / 3;

  return {
    Neuroticismo: { Geral: N_Geral, N1: EB_N1, N2: EB_N2, N3: EB_N3, N4: EB_N4 },
    Extroversao: { Geral: E_Geral, E1: EB_E1, E2: EB_E2, E3: EB_E3, E4: EB_E4 },
    Socializacao: { Geral: S_Geral, S1: EB_S1, S2: EB_S2, S3: EB_S3 },
    Realizacao: { Geral: R_Geral, R1: EB_R1, R2: EB_R2, R3: EB_R3 },
    Abertura: { Geral: A_Geral, A1: EB_A1, A2: EB_A2, A3: EB_A3 }
  };
};

const perguntasBFP = [
  { id: '1', texto: '1. Procuro seguir as regras sociais sem questioná-las.' },
  { id: '2', texto: '2. Tento fazer com que as pessoas se sintam bem.' },
  { id: '3', texto: '3. Gosto de falar de mim.' },
  { id: '4', texto: '4. Tenho um "coração mole".' },
  { id: '5', texto: '5. Falo tudo o que penso.' },
  { id: '6', texto: '6. Gosto de fazer coisas que nunca fiz antes.' },
  { id: '7', texto: '7. Acredito que as pessoas têm boas intenções.' },
  { id: '8', texto: '8. Sou divertido.' },
  { id: '9', texto: '9. Tomo cuidado com o que falo.' },
  { id: '10', texto: '10. Dificilmente perdoo.' },
  { id: '11', texto: '11. Divirto-me quando estou entre muitas pessoas.' },
  { id: '12', texto: '12. Respeito os sentimentos alheios.' },
  { id: '13', texto: '13. Mesmo quando preciso resolver alguma coisa para mim, costumo adiar até o último momento.' },
  { id: '14', texto: '14. Tento influenciar os outros.' },
  { id: '15', texto: '15. Sou generoso(a).' },
  { id: '16', texto: '16. Estou satisfeito comigo mesmo.' },
  { id: '17', texto: '17. Não falo muito.' },
  { id: '18', texto: '18. Posso agredir fisicamente as pessoas quando estou irritado(a).' },
  { id: '19', texto: '19. Resolvo meus problemas sem pensar muito.' },
  { id: '20', texto: '20. Preocupo-me com todos.' },
  { id: '21', texto: '21. Geralmente me sinto feliz.' },
  { id: '22', texto: '22. Preciso de estímulo para começar a fazer as coisas.' },
  { id: '23', texto: '23. Tenho pouco interesse por exposições de arte.' },
  { id: '24', texto: '24. Divirto-me contrariando as pessoas.' },
  { id: '25', texto: '25. Com frequência tomo decisões precipitadas.' },
  { id: '26', texto: '26. Facilmente coloco minhas ideias em prática.' },
  { id: '27', texto: '27. Uso as pessoas para conseguir o que desejo.' },
  { id: '28', texto: '28. Posso lidar com muitas tarefas ao mesmo tempo.' },
  { id: '29', texto: '29. Quase sempre me sinto desanimado.' },
  { id: '30', texto: '30. Suspeito das intenções das pessoas.' },
  { id: '31', texto: '31. Atualmente, defendo ideias diferentes daquelas que defendia antigamente.' },
  { id: '32', texto: '32. Consigo o que eu quero.' },
  { id: '33', texto: '33. Tenho pouca curiosidade para conhecer novos estilos musicais.' },
  { id: '34', texto: '34. Dedico-me muito para fazer bem as coisas.' },
  { id: '35', texto: '35. Espero pela decisão dos outros.' },
  { id: '36', texto: '36. Interesso-me por teorias que tentam explicar o universo.' },
  { id: '37', texto: '37. Tenho pouca paciência para terminar tarefas muito longas ou difíceis.' },
  { id: '38', texto: '38. Sou uma pessoa tímida.' },
  { id: '39', texto: '39. Tenho alguns inimigos.' },
  { id: '40', texto: '40. Acho que a minha vida é vazia e sem emoção.' },
  { id: '41', texto: '41. Começo rapidamente as tarefas que eu tenho para fazer.' },
  { id: '42', texto: '42. Acho pouco interessantes exposições fotográficas.' },
  { id: '43', texto: '43. Respeito o ponto de vista dos outros.' },
  { id: '44', texto: '44. Tenho dificuldade para me adaptar a trabalhos que envolvam uma rotina fixa.' },
  { id: '45', texto: '45. Antes de agir, penso no que pode acontecer.' },
  { id: '46', texto: '46. Sinto-me mal se não cumpro algo que prometi.' },
  { id: '47', texto: '47. Adoro atividades em grupo.' },
  { id: '48', texto: '48. Tudo o que posso ver a minha frente é mais desprazer do que prazer.' },
  { id: '49', texto: '49. Gosto de ir a lugares que não conheço.' },
  { id: '50', texto: '50. Converso com muitas pessoas diferentes quando vou a festas.' },
  { id: '51', texto: '51. Ajo impulsivamente quando alguma coisa está me aborrecendo.' },
  { id: '52', texto: '52. Gosto de ter uma vida social agitada.' },
  { id: '53', texto: '53. Participar de atividades que envolvam criatividade e/ou fantasia me empolga.' },
  { id: '54', texto: '54. Me esforço para ter destaque na escola ou no trabalho.' },
  { id: '55', texto: '55. Geralmente faço o que os meus amigos e parentes querem, embora não concorde com eles, com medo de que se afastem de mim.' },
  { id: '56', texto: '56. Tenho pouco interesse por ideias abstratas.' },
  { id: '57', texto: '57. Acho que os outros zombam de mim.' },
  { id: '58', texto: '58. Costumo fazer sacrifícios para conseguir o que quero.' },
  { id: '59', texto: '59. Acho natural que os valores morais mudem ao longo do tempo.' },
  { id: '60', text: '60. Tenho muito medo de que os meus amigos deixem de gostar de mim.' },
  { id: '61', texto: '61. Tento incentivar pessoas.' },
  { id: '62', texto: '62. Sou uma pessoa com pouca imaginação.' },
  { id: '63', texto: '63. Faço coisas consideradas perigosas.' },
  { id: '64', texto: '64. Penso sobre o que preciso fazer para alcançar meus objetivos.' },
  { id: '65', texto: '65. Sou uma pessoa nervosa.' },
  { id: '66', texto: '66. Costumo ficar calado quando estou entre estranhos.' },
  { id: '67', texto: '67. Resolvo meus problemas com rapidez.' },
  { id: '68', texto: '68. Confio no que as pessoas dizem.' },
  { id: '69', texto: '69. Acho que não existe uma verdade absoluta.' },
  { id: '70', texto: '70. Por mais que me esforce, sei que não sou capaz de superar os obstáculos que tenho que enfrentar no dia a dia.' },
  { id: '71', texto: '71. Envolvo-me rapidamente com os outros.' },
  { id: '72', texto: '72. Gosto de pensar sobre as soluções diferentes para problemas complexos.' },
  { id: '73', texto: '73. Deixo de fazer as coisas que desejo por medo de ser criticado pelos outros.' },
  { id: '74', texto: '74. Acredito que a maioria dos valores morais são dependentes da época e do lugar.' },
  { id: '75', texto: '75. Fico muito tímido quando estou entre desconhecidos.' },
  { id: '76', texto: '76. Preocupo-me em agir segundo as leis.' },
  { id: '77', texto: '77. Meu humor varia constantemente.' },
  { id: '78', texto: '78. Necessito estar no centro das atenções.' },
  { id: '79', texto: '79. Sinto-me muito insecure quando tenho que fazer coisas que nunca fiz antes.' },
  { id: '80', texto: '80. As pessoas dizem que sou muito detalhista.' },
  { id: '81', texto: '81. Evito discussões filosóficas.' },
  { id: '82', texto: '82. Não gosto de expressar as minhas ideias, pois tenho medo de ser ridicularizado.' },
  { id: '83', texto: '83. Sou capaz de assumir tarefas importantes.' },
  { id: '84', texto: '84. Gosto de manter a rotina.' },
  { id: '85', texto: '85. Acho que faço bem as coisas.' },
  { id: '86', texto: '86. Sou uma pessoa irritável.' },
  { id: '87', texto: '87. Costumo enganar as pessoas.' },
  { id: '88', texto: '88. Gosto de trabalhos artísticos que são considerados estranhos.' },
  { id: '89', texto: '89. Tenho muita dificuldade em tomar decisões na minha vida.' },
  { id: '90', texto: '90. Vivo minhas emoções intensamente.' },
  { id: '91', texto: '91. Gosto de fazer coisas que exigem muito de mim.' },
  { id: '92', texto: '92. Sofro quando encontro alguém que está com dificuldades.' },
  { id: '93', texto: '93. É comum terem inveja de mim.' },
  { id: '94', texto: '94. Sempre que posso, mudo os trajetos nos meus percursos diários.' },
  { id: '95', texto: '95. Tenho dificuldade para terminar as tarefas, pois me distraio com outras coisas.' },
  { id: '96', texto: '96. Preocupo-me com aqueles que estão numa situação pior que a minha.' },
  { id: '97', texto: '97. Sou comunicativo.' },
  { id: '98', texto: '98. Acho que os outros podem tentar me prejudicar.' },
  { id: '99', texto: '99. Sinto uma incontrolável vontade de falar, mesmo que seja com quem não conheço.' },
  { id: '100', texto: '100. Eu paro de fazer as coisas quando elas ficam muito difíceis.' },
  { id: '101', texto: '101. Escolho palavras com cuidado.' },
  { id: '102', texto: '102. Com frequência, passo por períodos em que fico extremamente irritável, incomodando-me com qualquer coisa.' },
  { id: '103', texto: '103. Raramente mostro um trabalho a outras pessoas antes de revisá-lo cuidadosamente.' },
  { id: '104', texto: '104. Importo-me com os sentimentos dos outros.' },
  { id: '105', texto: '105. Faço muitas coisas durante as minhas horas de folga.' },
  { id: '106', texto: '106. Estou cansado de viver.' },
  { id: '107', texto: '107. Gosto de quebrar regras.' },
  { id: '108', texto: '108. Costumo tomar a iniciativa e conversar com os outros.' },
  { id: '109', texto: '109. Respeito as autoridades.' },
  { id: '110', texto: '110. Sou uma pessoa insegura.' },
  { id: '111', texto: '111. Quando estou em um grupo, gosto que me deem atenção.' },
  { id: '112', texto: '112. Meus amigos dizem que eu trabalho/estudo demais.' },
  { id: '113', texto: '113. Sinto-me entediado quando tenho que fazer as mesmas coisas.' },
  { id: '114', texto: '114. Exijo muito de mim mesmo.' },
  { id: '115', texto: '115. Tenia dificuldade para participar de atividades que exijam imaginação ou fantasia.' },
  { id: '116', texto: '116. Gosto de programar detalhadamente as coisas que tenho para fazer.' },
  { id: '117', texto: '117. Usualmente, tomo iniciativa nas situações.' },
  { id: '118', texto: '118. Sinto-me muito mal quando recebo alguma crítica.' },
  { id: '119', texto: '119. Acredito que as pessoas têm uma natureza ruim.' },
  { id: '120', texto: '120. Dificilmente fico sem jeito.' },
  { id: '121', texto: '121. Só me aproximo de uma pessoa quando estou certo de que ela concorda com as minhas opiniões e atitudes, para evitar críticas ou desaprovação.' },
  { id: '122', texto: '122. Sei o que quero para minha vida.' },
  { id: '123', texto: '123. Frequentemente questiono regras e costumes sociais.' },
  { id: '124', texto: '124. Tenho uma grande dificuldade em dormir.' },
  { id: '125', texto: '125. Preocupo-me em agradar as pessoas.' },
  { id: '126', texto: '126. Sou disposto a rever meu posicionamento sobre diferentes assuntos.' }
];

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) return Alert.alert("Atenção", "Preencha e-mail e senha.");
    setLoadingLogin(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      await AsyncStorage.removeItem('@bfp_progresso');
      navigation.navigate('Instrucoes');
    } catch (error) {
      Alert.alert("Erro de Login", "Verifique suas credenciais.");
    }
    setLoadingLogin(false);
  };

  const handleCadastro = async () => {
    if (!email || !senha) return Alert.alert("Atenção", "Preencha e-mail e senha.");
    setLoadingLogin(true);
    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      await AsyncStorage.removeItem('@bfp_progresso');
      Alert.alert("Sucesso", "Conta criada! Faça login para continuar.");
    } catch (error) {
      Alert.alert("Erro de Cadastro", error.message);
    }
    setLoadingLogin(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.containerLogin}>
      <View style={styles.headerLogin}>
        <Text style={styles.titleLogin}>Avaliação BFP</Text>
        <Text style={styles.subtitleLogin}>Acesso do Paciente</Text>
      </View>

      <View style={styles.cardLogin}>
        <Text style={styles.labelInput}>Credenciais</Text>
        <TextInput
          style={styles.inputCustom}
          placeholder="E-mail"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.inputCustom}
          placeholder="Senha"
          placeholderTextColor="#9CA3AF"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btnPrimary, loadingLogin && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loadingLogin}
        >
          {loadingLogin ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.txtBtnPrimary}>ENTRAR</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleCadastro} disabled={loadingLogin}>
          <Text style={styles.txtBtnSecondary}>CADASTRAR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OU</Text>
        <View style={styles.separatorLine} />
      </View>

      <View style={styles.areaProfissional}>
        <Text style={styles.textoAcessoRestrito}>Acesso restrito a profissionais</Text>
        <TouchableOpacity
          style={styles.btnPsicologa}
          onPress={() => navigation.navigate('PainelPsicologa')}
        >
          <Text style={styles.txtBtnPsicologa}>ÁREA DA PSICÓLOGA</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function PainelPsicologaScreen({ navigation }) {
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "resultadosBFP"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      lista.sort((a, b) => new Date(b.data) - new Date(a.data));
      setPacientes(lista);
      setCarregando(false);
    }, (erro) => {
      Alert.alert("Erro", "Não foi possível sincronizar os dados.");
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.containerGeral}>
      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Sincronizando dados...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.subtituloPainel}>Testes registrados no sistema</Text>
          {pacientes.length === 0 ? (
            <Text style={styles.textoVazio}>Nenhum teste foi realizado ainda.</Text>
          ) : (
            <FlatList
              data={pacientes}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR');
                return (
                  <View style={styles.cardPaciente}>
                    <View style={styles.headerPaciente}>
                      <Text style={styles.emailPaciente}>{item.usuario}</Text>
                      <Text style={styles.dataPaciente}>{dataFormatada}</Text>
                    </View>
                    <View style={styles.resultadoRow}>
                      <Text style={styles.textoFatorLista}>Neuroticismo</Text>
                      <Text style={styles.textoFatorValor}>{item.resultadosFinais.Neuroticismo.Geral.toFixed(2)}</Text>
                    </View>
                    <View style={styles.resultadoRow}>
                      <Text style={styles.textoFatorLista}>Extroversão</Text>
                      <Text style={styles.textoFatorValor}>{item.resultadosFinais.Extroversao.Geral.toFixed(2)}</Text>
                    </View>
                    <View style={styles.resultadoRow}>
                      <Text style={styles.textoFatorLista}>Socialização</Text>
                      <Text style={styles.textoFatorValor}>{item.resultadosFinais.Socializacao.Geral.toFixed(2)}</Text>
                    </View>
                    <View style={styles.resultadoRow}>
                      <Text style={styles.textoFatorLista}>Realização</Text>
                      <Text style={styles.textoFatorValor}>{item.resultadosFinais.Realizacao.Geral.toFixed(2)}</Text>
                    </View>
                    <View style={styles.resultadoRowSemBorda}>
                      <Text style={styles.textoFatorLista}>Abertura</Text>
                      <Text style={styles.textoFatorValor}>{item.resultadosFinais.Abertura.Geral.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

function InstrucoesScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.containerScroll}>
      <Text style={styles.textoInstrucao}>
        Abaixo você encontrará uma série de frases. Leia cada uma delas cuidadosamente e indique o quanto a frase descreve você.
      </Text>

      <View style={styles.caixaEscala}>
        <Text style={styles.tituloEscala}>Escala de Respostas</Text>
        <Text style={styles.itemEscala}>1 - Descreve muito mal</Text>
        <Text style={styles.itemEscala}>2 - Descreve mal</Text>
        <Text style={styles.itemEscala}>3 - Descreve um pouco mal</Text>
        <Text style={styles.itemEscala}>4 - Neutro</Text>
        <Text style={styles.itemEscala}>5 - Descreve um pouco bem</Text>
        <Text style={styles.itemEscala}>6 - Descreve bem</Text>
        <Text style={styles.itemEscala}>7 - Descreve muito bem</Text>
      </View>

      <Text style={styles.textoInstrucaoDestaque}>
        Responda o mais sinceramente possível. Tente não deixar nenhuma questão em branco. O teste possui 126 questões.
      </Text>

      <TouchableOpacity style={styles.btnIniciar} onPress={() => navigation.navigate('Teste')}>
        <Text style={styles.txtBtnIniciar}>INICIAR TESTE AGORA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function TesteScreen({ navigation }) {
  const [respostas, setRespostas] = useState({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarProgresso = async () => {
      try {
        const progressoSalvo = await AsyncStorage.getItem('@bfp_progresso');
        setRespostas(progressoSalvo ? JSON.parse(progressoSalvo) : {});
        setCarregando(false);
      } catch (e) { setCarregando(false); }
    };
    carregarProgresso();
  }, []);

  const responder = async (id, valor) => {
    const novasRespostas = { ...respostas, [id]: valor };
    setRespostas(novasRespostas);
    await AsyncStorage.setItem('@bfp_progresso', JSON.stringify(novasRespostas));
  };

  const finalizarTeste = () => {
    const respondidas = Object.keys(respostas);
    const faltantes = perguntasBFP.filter(p => !respondidas.includes(p.id)).map(p => p.id);
    let respostasCompletas = { ...respostas };

    faltantes.forEach(id => { respostasCompletas[id] = 4; });
    const resultadosCalculados = calcularResultadosBFP(respostasCompletas);

    try {
      addDoc(collection(db, "resultadosBFP"), {
        usuario: auth.currentUser?.email || "anonimo",
        respostasBrutas: respostasCompletas,
        resultadosFinais: resultadosCalculados,
        data: new Date().toISOString()
      }).catch(() => {});
    } catch (e) {}

    if (Platform.OS !== 'web') Vibration.vibrate(500);

    AsyncStorage.removeItem('@bfp_progresso');
    navigation.navigate('Resultados', { resultados: resultadosCalculados });
  };

  if (carregando) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.containerGeral}>
      <FlatList
        data={perguntasBFP}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.btnFinalizar} onPress={finalizarTeste}>
            <Text style={styles.txtBtnFinalizar}>FINALIZAR E VER RESULTADOS</Text>
          </TouchableOpacity>
        )}
        renderItem={({ item }) => (
          <View style={styles.cardPergunta}>
            <Text style={styles.perguntaTexto}>{item.texto}</Text>
            <View style={styles.opcoesContainer}>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.botaoOpcao, respostas[item.id] === num && styles.botaoSelecionado]}
                  onPress={() => responder(item.id, num)}
                >
                  <Text style={[styles.textoBotaoOpcao, respostas[item.id] === num && styles.textoBotaoOpcaoSelecionado]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

function ResultadosScreen({ route, navigation }) {
  const { resultados } = route.params;

  const compartilharResultados = async () => {
    try {
      const emailPaciente = auth.currentUser?.email || "Paciente Anônimo";
      const textoFormatado = `RESULTADOS BFP\nPaciente: ${emailPaciente}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n` +
        `Neuroticismo: ${resultados.Neuroticismo.Geral.toFixed(2)}\n` +
        `Extroversão: ${resultados.Extroversao.Geral.toFixed(2)}\n` +
        `Socialização: ${resultados.Socializacao.Geral.toFixed(2)}\n` +
        `Realização: ${resultados.Realizacao.Geral.toFixed(2)}\n` +
        `Abertura: ${resultados.Abertura.Geral.toFixed(2)}\n`;

      await Share.share({
        message: textoFormatado,
        title: `Relatório BFP - ${emailPaciente}`
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o compartilhamento.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.containerScroll}>
      <Text style={styles.subtituloPainel}>Relatório Final do Paciente</Text>
      <View style={styles.gridResultados}>
        {Object.entries(resultados).map(([nome, dados]) => (
          <View key={nome} style={styles.cardResultado}>
            <Text style={styles.tituloFator}>{nome}</Text>
            <Text style={styles.pontuacaoFator}>{dados.Geral.toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.containerAcoes}>
        <TouchableOpacity style={styles.btnOutline} onPress={compartilharResultados}>
          <Text style={styles.txtBtnOutline}>COMPARTILHAR RESULTADOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.popToTop()}>
          <Text style={styles.txtBtnPrimary}>VOLTAR AO INÍCIO</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function App() {
  const [appPronto, setAppPronto] = useState(false);

  useEffect(() => {
    if (auth) {
      setAppPronto(true);
    }
  }, []);

  if (!appPronto) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#F4F7F6' },
          headerShadowVisible: false,
          headerTintColor: '#1F2937',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PainelPsicologa" component={PainelPsicologaScreen} options={{ title: 'Área da Profissional', headerTintColor: '#8B5CF6' }} />
        <Stack.Screen name="Instrucoes" component={InstrucoesScreen} options={{ title: 'Instruções' }} />
        <Stack.Screen name="Teste" component={TesteScreen} options={{ title: 'Avaliação BFP' }} />
        <Stack.Screen name="Resultados" component={ResultadosScreen} options={{ headerBackVisible: false, title: 'Resultados' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  containerGeral: { flex: 1, padding: 20, backgroundColor: '#F4F7F6' },
  containerScroll: { flexGrow: 1, padding: 20, backgroundColor: '#F4F7F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7F6' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 15, fontWeight: '500' },

  containerLogin: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F4F7F6' },
  headerLogin: { alignItems: 'center', marginBottom: 40 },
  titleLogin: { fontSize: 32, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  subtitleLogin: { fontSize: 16, color: '#6B7280', marginTop: 8, fontWeight: '500' },

  cardLogin: { backgroundColor: '#FFFFFF', padding: 28, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  labelInput: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputCustom: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, color: '#1F2937', marginBottom: 16 },

  btnPrimary: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  txtBtnPrimary: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  btnSecondary: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  txtBtnSecondary: { color: '#4B5563', fontSize: 15, fontWeight: '700' },

  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 35, paddingHorizontal: 10 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  separatorText: { marginHorizontal: 15, color: '#9CA3AF', fontSize: 12, fontWeight: '600' },

  areaProfissional: { alignItems: 'center', paddingBottom: 20 },
  textoAcessoRestrito: { color: '#6B7280', fontSize: 13, marginBottom: 12, fontWeight: '500' },
  btnPsicologa: { backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', width: '100%' },
  txtBtnPsicologa: { color: '#8B5CF6', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },

  subtituloPainel: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  textoVazio: { textAlign: 'center', color: '#9CA3AF', marginTop: 30, fontSize: 15 },

  cardPaciente: { backgroundColor: '#FFFFFF', padding: 20, marginBottom: 16, borderRadius: 16, borderLeftWidth: 6, borderLeftColor: '#8B5CF6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  headerPaciente: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  emailPaciente: { fontWeight: '700', fontSize: 15, color: '#1F2937', flex: 1 },
  dataPaciente: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  resultadoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  resultadoRowSemBorda: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  textoFatorLista: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  textoFatorValor: { fontSize: 14, color: '#1F2937', fontWeight: '700' },

  textoInstrucao: { fontSize: 16, marginBottom: 20, lineHeight: 26, color: '#374151' },
  textoInstrucaoDestaque: { fontSize: 15, marginTop: 10, marginBottom: 30, lineHeight: 24, color: '#4B5563', fontStyle: 'italic', textAlign: 'center' },
  caixaEscala: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  tituloEscala: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemEscala: { fontSize: 15, marginBottom: 12, color: '#4B5563', fontWeight: '500' },
  btnIniciar: { backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 18, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  txtBtnIniciar: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  cardPergunta: { backgroundColor: '#FFFFFF', padding: 24, marginBottom: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  perguntaTexto: { marginBottom: 20, fontSize: 16, color: '#1F2937', lineHeight: 24, fontWeight: '600' },
  opcoesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  botaoOpcao: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  botaoSelecionado: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  textoBotaoOpcao: { color: '#4B5563', fontSize: 15, fontWeight: '600' },
  textoBotaoOpcaoSelecionado: { color: '#FFFFFF', fontWeight: '700' },

  btnFinalizar: { backgroundColor: '#10B981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 40, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  txtBtnFinalizar: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },

  gridResultados: { marginBottom: 10 },
  cardResultado: { backgroundColor: '#FFFFFF', padding: 20, marginBottom: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloFator: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
  pontuacaoFator: { fontSize: 22, fontWeight: '800', color: '#4F46E5' },
  containerAcoes: { marginTop: 20, marginBottom: 40, gap: 16 },
  btnOutline: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#4F46E5' },
  txtBtnOutline: { color: '#4F46E5', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }
});