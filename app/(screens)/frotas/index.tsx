import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { useStepProgressContext } from "@/contexts/use-step-progress";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

export default function Frota() {
    const { setFrota, setActiveFrota, frota, activeFrota } = useStepProgressContext()

    const [selectedFrota, setSelectedFrota] = useState<string>("");

    const [popUp, setPopUp] = useState<boolean>(false);

    const route = useRouter();

    const card = [{
        name: "moto",
        description: "Veículo automotor de duas rodas para locomoção de funcionário dentro da empresa"
    }, {
        name: "carro",
        description: "Veículo automotor de quatro rodas para locomoção de funcionário dentro da empresa"
    }, {
        name: "trator",
        description: "Veículo automotor de alta capacidade de forca e carga para trabalhos manuais"
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

                <Text className="text-xl font-bold">Escolha a frota a ser utilizada para o trabalho</Text>

                <View
                    className="gap-6"
                >
                    {
                        card.map(item => (
                            <TouchableOpacity
                                key={item.name}
                                className="shadow-sm shadow-slate-300 bg-slate-100 p-4 m-3 rounded-lg"
                                onPress={() => {
                                    setPopUp(!popUp)
                                    setSelectedFrota(item.name)
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
                        Você escolheu {selectedFrota}, este é o veículo certo?
                    </Text>
                    <View
                        className="flex flex-row gap-6"
                    >
                        <Button
                            className="bg-green-500"
                            onPress={() => {
                                setFrota(selectedFrota)
                                route.push('/')
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

    )
}