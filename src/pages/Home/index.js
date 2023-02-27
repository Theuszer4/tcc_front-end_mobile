import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from "react-native";
import {
  useFonts,
  Poppins_600SemiBold,
  Poppins_400Regular,
} from "@expo-google-fonts/poppins";
import { useContext, useEffect, useState } from "react";
import { api } from "../../services/api";
import { getDetalhesChamados } from "../../utils/getDetalhesChamados";
import Modal from "react-native-modal";
import ImageViewer from "react-native-image-zoom-viewer";
import { AuthContext } from "../../context/auth";
import ConfirmModal from "../../components/ConfirmModal";
import * as ImagePicker from "expo-image-picker";
import CardChamadoConcluido from "../../components/CardChamadoConcluido";
import { ThemeContext } from "../../context/theme";

export default function Home({ navigation }) {
  const { user } = useContext(AuthContext);
  const { styleTheme, toggleTheme } = useContext(ThemeContext);

  const [chamado, setChamado] = useState(null);
  const [chamadosConcluido, setChamadosConcluido] = useState([]);
  const [cancelar, setCancelar] = useState(false);
  const [concluirChamado, setConcluirChamado] = useState({
    descricao: "",
    anexo: {
      uri: "",
      type: "",
      name: "",
    },
  });
  const [erroDescricao, setErroDescricao] = useState("");

  const [modalImage, setModalImage] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [modalFinalizar, setModalFinalizar] = useState(false);

  function toggleModalImage() {
    setModalImage(!modalImage);
  }

  function toggleModalCancelar() {
    setModalCancelar(!modalCancelar);
  }

  function toggleModalFinalizar() {
    setModalFinalizar(!modalFinalizar);
  }

  async function anexarImagem() {
    let resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!resultado.canceled) {
      let imageName = resultado.assets[0].uri.split("/");
      imageName = imageName[imageName.length - 1];

      let tipo = imageName.split(".")[1];

      setConcluirChamado({
        ...concluirChamado,
        anexo: {
          uri: resultado.assets[0].uri,
          type: `image/${tipo}`,
          name: imageName,
        },
      });
    }
  }

  async function cancelarChamado() {
    try {
      await api.put(`/chamados/suspender/${chamado.id_chamado}`);

      setChamado([]);
      setCancelar(!cancelar);
      toggleModalCancelar();
    } catch (error) {
      console.log(error);
    }
  }

  async function finalizarChamado() {
    setErroDescricao("");

    if (concluirChamado.descricao) {
      const form = new FormData();

      form.append("descricao", concluirChamado.descricao);

      if (concluirChamado.anexo.uri !== "") {
        form.append("anexo", concluirChamado.anexo);
      }

      try {
        const response = await api.put(
          `/chamados/concluir/${chamado.id_chamado}`,
          form,
          {
            headers: {
              "content-type": "multipart/form-data",
            },
          }
        );

        console.log(response);

        toggleModalFinalizar();
      } catch (error) {
        console.log(error);
      }
    } else {
      setErroDescricao("A descrição é obrigatória!");
    }
  }

  async function getChamadoAndamento() {
    try {
      const response = await api.get(
        `/chamados?status_chamado=andamento&tecnico_id=${user.id_tecnico}`
      );

      if (response.data.length !== 0) {
        let detalhes = await getDetalhesChamados(response.data[0]);
        setChamado(detalhes);
      } else {
        setChamado([]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getChamadosConcluidos() {
    try {
      const response = await api.get(
        `/chamados?status_chamado=concluido&tecnico_id=${user.id_tecnico}`
      );

      if (response.data.length !== 0) {
        setChamadosConcluido(response.data);
      } else {
        setChamadosConcluido([]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getChamadoAndamento();
    getChamadosConcluidos();

    navigation.addListener("focus", () => {
      getChamadoAndamento();
      getChamadosConcluidos();
    });

    navigation.addListener("blur", () => {
      setChamado(null);
      setChamadosConcluido([]);
    });
  }, [navigation, cancelar]);

  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={[styles.container, styleTheme.container]}>
      <View style={styles.viewTitulo}>
        <Text style={[styles.titulo, styleTheme.textPrimary]}>Home</Text>
      </View>
      <View style={styles.viewChamado}>
        {chamado === null ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color="#23AFFF" />
          </View>
        ) : chamado.length !== 0 ? (
          <>
            <Text style={[styles.tituloChamado, styleTheme.textPrimary]}>Chamado em andamento</Text>
            <View style={[styles.containerChamado]}>
              <ScrollView>
                <Text style={[styles.nomeEmpresa, styleTheme.textPrimary]}>{chamado.nome_empresa}</Text>
                <View style={styles.field}>
                  <Text style={[styles.label, styleTheme.textPrimary]}>Endereco:</Text>
                  <Text style={[styles.valorField, styleTheme.textPrimary]}>
                    {chamado.endereco.logradouro}, {chamado.numero_endereco},{" "}
                    {chamado.endereco.bairro}, {chamado.endereco.localidade} -{" "}
                    {chamado.endereco.uf}
                  </Text>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, styleTheme.textPrimary]}>Contato:</Text>
                  <Text style={[styles.valorField, styleTheme.textPrimary]}>Tel: {chamado.telefone}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, styleTheme.textPrimary]}>Data do chamado:</Text>
                  <Text style={[styles.valorField, styleTheme.textPrimary]}>
                    {chamado.dataChamado} - {chamado.horaChamado}
                  </Text>
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, styleTheme.textPrimary]}>Problema:</Text>
                  <Text
                    style={[styles.valorField, styleTheme.textPrimary, { textTransform: "capitalize" }]}
                  >
                    {chamado.problema}
                  </Text>
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, styleTheme.textPrimary]}>Descrição:</Text>
                  <Text style={[styles.valorField, styleTheme.textPrimary]}>{chamado.descricao}</Text>
                </View>
                {chamado.anexo !== null ? (
                  <View style={styles.field}>
                    <Text style={[styles.label, styleTheme.textPrimary]}>Anexo:</Text>
                    <TouchableOpacity onPress={toggleModalImage}>
                      <Image
                        style={styles.anexo}
                        source={{
                          uri: `https://hdteste.azurewebsites.net/${chamado.anexo}`,
                        }}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <Modal
                      isVisible={modalImage}
                      backdropOpacity={0.1}
                      style={{ width: "100%", margin: 0, height: "100%" }}
                    >
                      <ImageViewer
                        imageUrls={[
                          {
                            url: `https://hdteste.azurewebsites.net/${chamado.anexo}`,
                          },
                        ]}
                        saveToLocalByLongPress={false}
                      />
                      <TouchableOpacity
                        style={styles.botaoModalImagem}
                        onPress={toggleModalImage}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.textoBotaoModalImagem}>Fechar</Text>
                      </TouchableOpacity>
                      <StatusBar backgroundColor="#000" />
                    </Modal>
                  </View>
                ) : null}
                <View style={styles.field}>
                  <Text style={[styles.label, styleTheme.textPrimary]}>Setor:</Text>
                  <Text style={[styles.valorField, styleTheme.textPrimary]}>{chamado.setor}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, styleTheme.textPrimary]}>Patrimônio:</Text>
                  <Text style={[styles.valorField, styleTheme.textPrimary]}>{chamado.patrimonio}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, styleTheme.textPrimary]}>Código de verificação:</Text>
                  <Text style={[styles.valorField, styleTheme.textPrimary]}>
                    {chamado.cod_verificacao}
                  </Text>
                </View>
              </ScrollView>
              <View style={styles.botoesChamado}>
                <TouchableOpacity
                  style={styles.botao}
                  onPress={toggleModalCancelar}
                >
                  <Text style={[styles.textoBotao, { color: "#23AFFF" }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.botao, { backgroundColor: "#23AFFF" }]}
                  onPress={toggleModalFinalizar}
                >
                  <Text style={[styles.textoBotao, { color: "#FFF" }]}>
                    Finalizar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.tituloChamado, styleTheme.textPrimary]}>
              Últimos chamados concluídos
            </Text>
            {chamadosConcluido.length !== 0 ? (
              <ScrollView>
                <View style={styles.containerChamadosConcluidos}>
                  {chamadosConcluido.map((chamado, index) => {
                    if (index < 5) {
                      return (
                        <CardChamadoConcluido
                          key={chamado.id_chamado}
                          chamado={chamado}
                        />
                      );
                    }
                  })}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.viewSemConcluidos}>
                <Text style={[styles.textSemConcluidos, styleTheme.textPrimary]}>
                  Você não há chamados concluidos.
                </Text>
              </View>
            )}
          </>
        )}
      </View>
      <ConfirmModal
        isVisible={modalCancelar}
        fecharModal={toggleModalCancelar}
        confirmarAcao={cancelarChamado}
        mensagem="Deseja cancelar esse chamado?"
      />
      <Modal isVisible={modalFinalizar} backdropOpacity={0.3}>
        <View style={[styles.viewFinalizar, styleTheme.containerSecundary]}>
          <Text style={[styles.tituloFinalizar, styleTheme.textPrimary]}>Finalizar Chamado</Text>
          <View style={styles.viewDescricao}>
            <Text style={[styles.label, styleTheme.textPrimary]}>Descrição:</Text>
            <TextInput
              style={styles.inputDescricao}
              value={concluirChamado.descricao}
              onChangeText={(e) =>
                setConcluirChamado({ ...concluirChamado, descricao: e })
              }
            />
            <Text style={styles.erroDescricao}>{erroDescricao}</Text>
          </View>
          <View style={styles.viewAnexo}>
            <View style={styles.inputAnexo}>
              <Text style={[styles.label, styleTheme.textPrimary]}>Anexar alguma imagem:</Text>
              <TouchableOpacity
                style={styles.botaoAnexo}
                onPress={anexarImagem}
              >
                <Text style={styles.textoBotaoAnexo}>Selecionar</Text>
              </TouchableOpacity>
            </View>
            {concluirChamado.anexo.uri !== "" ? (
              <Image
                style={styles.imagemAnexo}
                source={{
                  uri: concluirChamado.anexo.uri,
                }}
                resizeMode="contain"
              />
            ) : null}
          </View>
          <View style={styles.botoesFinalizar}>
            <TouchableOpacity
              style={styles.botao}
              onPress={() => {
                setConcluirChamado({
                  decricao: "",
                  anexo: {
                    uri: "",
                    type: "",
                    name: "",
                  },
                });
                setErroDescricao("");
                toggleModalFinalizar();
              }}
            >
              <Text style={[styles.textoBotao, { color: "#23AFFF" }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botao, { backgroundColor: "#23AFFF" }]}
              onPress={finalizarChamado}
            >
              <Text style={[styles.textoBotao, { color: "#FFF" }]}>
                Concluir
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
  },
  viewTitulo: {
    width: "80%",
    paddingTop: 35,
    paddingBottom: 15,
    marginBottom: 10,
    paddingLeft: 50,
    paddingRight: 50,
    borderBottomColor: "#818181",
    borderBottomWidth: 1,
    alignItems: "center",
  },
  titulo: {
    fontSize: 26,
    fontFamily: "Poppins_600SemiBold",
  },
  viewChamado: {
    flex: 1,
    width: "100%",
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 5,
  },
  tituloChamado: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    textAlign: "left",
    marginBottom: 15,
  },
  containerChamado: {
    width: "100%",
    height: "87%",
    padding: 10,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: "#23AFFF",
  },
  containerChamadosConcluidos: {
    width: "100%",
    height: "87%",
    padding: 2,
  },
  nomeEmpresa: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    width: "100%",
    textAlign: "center",
    marginBottom: 10,
  },
  field: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  valorField: {
    width: "100%",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  anexo: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    marginTop: 5,
  },
  botaoModalImagem: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#000",
  },
  textoBotaoModalImagem: {
    color: "#FFF",
    padding: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  botoesChamado: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  botao: {
    width: "45%",
    borderWidth: 2,
    borderRadius: 20,
    borderColor: "#23AFFF",
    padding: 6,
  },
  textoBotao: {
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },
  viewFinalizar: {
    borderRadius: 20,
    elevation: 10,
    alignItems: "center",
    padding: 15,
  },
  tituloFinalizar: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    marginBottom: 20,
  },
  viewDescricao: {
    width: "100%",
  },
  inputDescricao: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#23AFFF",
    height: 40,
    paddingLeft: 10,
  },
  viewAnexo: {
    width: "100%",
    display: "flex",
    marginBottom: 20,
    alignItems: "center",
  },
  inputAnexo: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  botaoAnexo: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "#23AFFF",
    borderRadius: 5,
  },
  textoBotaoAnexo: {
    fontFamily: "Poppins_400Regular",
    color: "#FFF",
  },
  imagemAnexo: {
    width: "70%",
    height: 130,
    backgroundColor: "#000",
    marginTop: 20,
  },
  botoesFinalizar: {
    marginTop: 20,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  erroDescricao: {
    fontFamily: "Poppins_700Bold",
    color: "red",
    textAlign: "center",
    padding: 10,
  },
  viewSemConcluidos: {
    flex: 1,
    width: "100%",
    alignItem: "center",
    justifyContent: "center",
  },
  textSemConcluidos: {
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
});
