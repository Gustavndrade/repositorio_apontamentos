import { Button, ButtonText } from "@/components/ui/button";
import { useStepProgressContext } from "@/contexts/use-step-progress";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { twMerge } from 'tailwind-merge';

export default function Initial() {
    const [inicio, setInicio] = useState<boolean>(false);
    const { frota, insumo, equipe, clear } = useStepProgressContext()

    useEffect(() => {
        // if(frota  && insumo  && equipe ) {
        //     setInicio(true)
        // } else {
        //     setInicio(false)
        // }
        setInicio(!!(frota && insumo && equipe))
    }, [frota, insumo, equipe])


    const route = useRouter();

    return (
        <View
            className="flex-1 bg-slate-400 justify-center"
        >
            <View
                className="flex gap-12 p-4"
            >
                <Button
                    className={"rounded-lg bg-orange-400 h-20 disabled:opacity-20 "}
                    onPress={() => {
                        route.push('./frotas')
                    }}
                    disabled={!!frota}
                >
                    <ButtonText>
                        Frota
                    </ButtonText>
                </Button>

                <Button
                    className={"rounded-lg bg-orange-400 h-20 disabled:opacity-20 "}
                    onPress={() => {
                        route.push('./insumos')
                    }}
                    disabled={!!insumo}
                >
                    <ButtonText>
                        Insumos
                    </ButtonText>
                </Button>

                <Button
                    className={"rounded-lg bg-orange-400 h-20 disabled:opacity-20 "}
                    onPress={() => {
                        route.push('/equipes')
                    }}
                    disabled={!!equipe}
                >
                    <ButtonText>
                        Equipe
                    </ButtonText>
                </Button>

                <Button
                    className="rounded-lg bg-orange-400 h-20 disabled:opacity-20"
                    disabled={!inicio}
                    onPress={() => {
                        route.push('./mapa')
                    }}
                >
                    <ButtonText>
                        Iniciar
                    </ButtonText>
                </Button>
                
                    <Button
                        onPress={() => {
                            clear();
                        }}
                    >
                        <ButtonText>Limpar escolhas</ButtonText>
                    </Button>
              
                {/* <View>
                    <Text>Suas escolhas:</Text>
                    <Text> Fota Isumo Equipe</Text>
                    <Text>{frota} {insumo} {equipe}</Text>
                </View> */}
            </View>
        </View>
    )
}