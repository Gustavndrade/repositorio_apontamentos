import { View, StyleSheet, Text } from "react-native";
import MapView from 'react-native-maps';

import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from "react";
import { Button, ButtonText } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { useStepProgressContext } from "@/contexts/use-step-progress";



export default function Mapa() {
    async function changeScreenOrientation() {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
    useEffect(() => {
        changeScreenOrientation()
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
    }, [])

    const { frota, equipe, insumo } = useStepProgressContext();

    const route = useRouter();
    return (


        <View
            className="flex-1 flex-row  "
        >
            <View
                className="flex h-full w-[40%] justify-center items-center">
                <View
                    className="flex gap-4"
                >
                    <Text
                    >Frota: {frota}</Text>
                    <Text>Equipe: {equipe}</Text>
                    <Text>Insumo: {insumo}</Text>
                    <View
                        className="flex gap-3"
                    >
                        <Button
                            onPress={() => {
                                route.push('/')
                            }}
                        >
                            <ButtonText>
                                &lt;- sair
                            </ButtonText>
                        </Button>

                        {/* <Button   
                    onPress={() => {
                        route.push('/')
                    }}
                >
                    <ButtonText>
                        Centralizar
                    </ButtonText>
                </Button> */}
                    </View>
                </View>
            </View>
            <View
                className=" h-full w-[60%]">
                <View className="h-full w-full relative">
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: -20.209094,
                            longitude: -50.9295278,
                            latitudeDelta: 0.0002,
                            longitudeDelta: 0.0001,
                        }}
                        provider="google"
                    >
                    </MapView>
                </View>
            </View>

        </View>
    )

}


const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%'
    }
})