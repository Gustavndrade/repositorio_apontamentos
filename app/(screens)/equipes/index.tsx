import { Button, ButtonText } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { useStepProgressContext } from "@/contexts/use-step-progress"
import { useRouter } from "expo-router"
import { useState } from "react"
import { Modal, Text, TouchableOpacity, View } from "react-native"

export default function Equipes() {

        const { setEquipe } = useStepProgressContext();

    const route = useRouter()
    
    const card = [{
            name: "Motoristas",
            description: "Pessoas preparadas e habilitadas a pilotor veículos automotores"
        },
        {
            name: "Trabalhadores",
            description: "Pessoas preparadas e habilitadas fazer trabalhos braçais e em grupo"
        }]

        const [popUp, setPopUp] = useState<boolean>(false)

        const [selectedEquipe, setSelectedEquipe] = useState<string>("");

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

                <Text className="text-xl font-bold">Escolha sua equipe</Text>

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
                                    setSelectedEquipe(item.name)
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
                            Você escolheu {selectedEquipe}, este é o insumo certo?
                        </Text>
                        <View
                            className="flex flex-row gap-6"
                        >
                            <Button
                                className="bg-green-500"
                                onPress={() => {
                                    route.push('/')
                                    setEquipe(selectedEquipe)
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