import { View, StyleSheet, Text, ImageURISource } from "react-native";
import MapView, { LocalTile, Marker, Polyline, Region, UrlTile } from 'react-native-maps';

import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useRef, useState } from "react";
import { Button, ButtonText } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { useStepProgressContext } from "@/contexts/use-step-progress";
import UseMap from "./use_mapa";

import { Pause, Play, RotateCw, ArrowLeft } from 'lucide-react-native';
import { Directory, Paths } from "expo-file-system";


const volta = () => {
    return (
        <ArrowLeft />
    );
}

const reload = () => {
    return (
        <RotateCw />
    );
}

const play = () => {
    return (
        <Play />
    );
}

const pause = () => {
    return (
        <Pause />
    );
};

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

    const { frota } = useStepProgressContext() as { frota: TipoFrota };
    const { insumo, equipe } = useStepProgressContext()

    const route = useRouter();

    const mapRef = useRef<MapView>(null)

    const {
        tempoAtividade,
        setStart,
        start,
        formataTimer,
        limpaTimer,
        ultimaPosicao,
        local,
        heading,
        mapState,
        setMapState
    } = UseMap({
        mapRef
    });

    type TipoFrota = "moto" | "carro" | "trator"

    const veiculoEnum: Record<TipoFrota, any> = {
        moto: require("../../../assets/images/moto.png"),
        carro: require("../../../assets/images/carro.png"),
        trator: require("../../../assets/images/trator.png")
    }

    const rootFolder = new Directory(Paths.document, 'maps').uri;

    type tipoLink = {
        urlTemplate: string,
        offlineUrlTemplate: string,
        isOffline: boolean,
        mapRegion: Region | undefined
    }

    const [estadoUrl, setEstadoUrl] = useState<tipoLink>({
        urlTemplate: 'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        offlineUrlTemplate: `${rootFolder}tiles/{z}/{x}/{y}.png`,
        isOffline: true,
        mapRegion: undefined
    })

    return (

        <View
            className="flex-1 flex-row"
        >
            <View
                className="flex h-full w-[40%] justify-center items-center">
                <View
                    className="flex gap-10 items-center"
                >
                    <Text
                        className="bg-slate-200/80 p-2 rounded-md shadow-slate-400 shadow-sm"
                    >tempo: {formataTimer(tempoAtividade)}
                    </Text>
                    <View
                        className="bg-slate-200/80 p-3 rounded-md shadow-slate-400 shadow-sm">
                        <Text>Frota: {frota}</Text>
                        <Text>Equipe: {equipe}</Text>
                        <Text>Insumo: {insumo}</Text>
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
                            latitudeDelta: 0.0005,
                            longitudeDelta: 0.0001,
                        }}

                        onRegionChange={(mapRegion) => {
                            setMapState(prev => ({
                                ...prev,
                                mapRegion: mapRegion as any,
                            }))
                        }}>

                        <UrlTile
                            urlTemplate={estadoUrl.offlineUrlTemplate}
                            zIndex={1}
                            maximumZ={19}
                        />

                        <Marker
                            coordinate={ultimaPosicao}
                            anchor={{ x: 0.5, y: 0.5 }}
                            image={veiculoEnum[frota]}
                            rotation={(heading + 90) % 360}
                            flat={true}
                        />

                        <View
                            className="flex bg gap-8 justify-center mr-4"
                        >
                            <Button
                                className="bg-orange-400 rounded-full disabled:opacity-30"
                                disabled={start}
                                onPress={() => {
                                    route.push('/')
                                }}
                            >
                                {<ArrowLeft size={20} color={"white"} />}
                            </Button>

                            <Button
                                onPress={() => { setStart(!start) }}
                                className="bg-orange-400 rounded-full"
                            >
                                {!start ? <Play size={20} color={"white"} /> : <Pause color={"white"} size={20} />}
                            </Button>

                            <Button
                                onPress={() => { limpaTimer() }}
                                className="bg-orange-400 rounded-full disabled:opacity-30"
                                disabled={start}
                            >
                                {<RotateCw size={20} color={"white"} />}
                            </Button>

                        </View>

                        <Polyline
                            coordinates={local}
                            strokeColor="#FF6B00"
                            strokeColors={[
                                '#FF6B00'
                            ]}
                            strokeWidth={10}
                        />
                    </MapView>
                </View>
            </View>

        </View>
    )

}


const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row-reverse'
    }
})