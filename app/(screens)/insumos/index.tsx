import { View } from "@/components/Themed"
import { Button, ButtonText } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading";
import { useStepProgressContext } from "@/contexts/use-step-progress";
import { useRouter } from "expo-router"
import { useState } from "react";
import { Modal, Text, TouchableOpacity } from "react-native";

export default function Insumos() {

    const route = useRouter();

    const [selectedInsumo, setSelectedInsumo] = useState<string>("")

    const [popUp, setPopUp] = useState<boolean>(false)

    const { setInsumo } = useStepProgressContext();

    const card = [{
        name: "fertilizantes",
        description: "Substâncias que fornecem nutrientes essenciais para o crescimento das plantas."
    }, {
        name: "defensivos agrícolas",
        description: "Produtos utilizados para proteger as culturas contra pragas, doenças e ervas daninhas."
    }, {
        name: "sementes melhoradas",
        description: "Sementes desenvolvidas para aumentar a resistência a doenças e a produtividade das culturas."
    },]

    return (
        <View
            className="flex-1 items-center justify-center"
        >

            <View
                className="p-3 gap-8"
            >
                <Button
                    className="w-20 items-center"
                    onPress={() => route.push('/')}
                >
                    <ButtonText>
                        &lt;-
                    </ButtonText>
                </Button>

                <Text className="text-xl font-bold">Escolha o insumo a ser utilizada para o trabalho</Text>

                <View
                    className="gap-4"
                >
                    {
                        card.map(item => (
                            <TouchableOpacity
                                key={item.name}
                                className="shadow-sm shadow-slate-300 bg-slate-100 p-4 m-3 rounded-lg"
                                onPress={() => {
                                    setPopUp(!popUp)
                                    setSelectedInsumo(item.name)
                                }}
                            >
                                <Heading size="md" className="mb-1">
                                    {item.name.toUpperCase()}
                                </Heading>
                                <Text>{item.description}</Text>

                            </TouchableOpacity>
                        ))
                    }

                </View>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={popUp}
                >
                    <View
                        className="flex-1 justify-center items-center gap-6 bg-white"
                    >
                        <Text
                            className="text-center"
                        >
                            Você escolheu {selectedInsumo}, essa é sua equipe?
                        </Text>
                        <View
                            className="flex flex-row gap-6"
                        >
                            <Button
                                className="bg-green-500"
                                onPress={() => {
                                    route.push('/')
                                    setInsumo(selectedInsumo)
                                }}
                            >
                                <ButtonText>
                                    SIM
                                </ButtonText>
                            </Button>
                            <Button
                                className="bg-red-500"
                                onPress={() => {
                                    setPopUp(!popUp)
                                }}
                            >
                                <ButtonText>
                                    NÃO
                                </ButtonText>
                            </Button>
                        </View>
                    </View>

                </Modal>

            </View>

        </View>
    )
}