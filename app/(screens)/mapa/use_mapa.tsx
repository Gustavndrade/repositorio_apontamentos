import { useEffect, useRef, useState } from "react";

import * as Location from "expo-location"
import MapView from "react-native-maps";
import { tileGridForRegion } from "./function";
import { Directory, Paths } from 'expo-file-system';

export default function UseMap({
    mapRef
}: {
    mapRef: React.RefObject<MapView | null>
}) {

    const [start, setStart] = useState<boolean>(false);

    const [tempoAtividade, setTempoAtividade] = useState<number>(0);

    const timerRef = useRef<number | null>(null);
    const ultimoTempoRef = useRef<number>(0)

    const [local, setLocal] = useState<{ latitude: number; longitude: number }[]>([]);
    const [heading, setHeading] = useState<number>(0);

    const directory = new Directory(Paths.cache, "maps");


    const [mapState, setMapState] = useState({
         urlTemplate: 'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        offlineUrlTemplate: `${directory.uri
        }tiles/{z}/{x}/{y}.png`,
        isOffline: true,
        mapRegion: undefined
    })


    const ultimaPosicao = local.length > 0 ? local[local.length - 1] : {
        latitude: -20.209013,
        longitude: -50.9294086,
    }

    const headingHistory = useRef<number[]>([]);

    //máscara pro timer
    function formataTimer(segundos: number) {
        const sec = Math.floor(segundos % 60)
        const min = Math.floor((segundos % 3600) / 60)
        const hr = Math.floor(segundos / 3600)

        const formato = (numero: number) => String(numero).padStart(2, "0")

        return `${formato(hr)}:${formato(min)}:${formato(sec)}`
    }

    // temporizador
    useEffect(() => {
        if (start) {

            timerRef.current = setInterval(() => {

                setTempoAtividade((prev) => {
                    ultimoTempoRef.current = prev + 1

                    console.log("tempo", prev)
                    return prev + 1
                })
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current),
                    timerRef.current = null
            }
        }
    }, [start])

    function limpaTimer() {
        setTempoAtividade(0);
    }

    //localização 
    useEffect(() => {

        let inscricao: Location.LocationSubscription | null = null;

        const localPermission = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.log("Permissão de localização Negada")
                return;
            }

            inscricao = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Highest,
                    timeInterval: 3000,
                },
                (loc) => {

                    // console.log(loc.coords);
                    setLocal((antLocal) => [
                        ...antLocal,
                        {
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude
                        },
                    ])
                }
            )
        }

        if (start) {
            localPermission();
        }

        return () => {
            if (inscricao) inscricao.remove();
            inscricao = null
        };
    }, [start])

    //smoothing
    const smoothHeading = (newHeading: number) => {
        const maxHistory = 10;
        headingHistory.current.push(newHeading);

        if (headingHistory.current.length > maxHistory) {
            headingHistory.current.shift();
        }

        const sinSum = headingHistory.current.reduce((acc, val) => acc + Math.sin(val * Math.PI / 180), 0);
        const cosSum = headingHistory.current.reduce((acc, val) => acc + Math.cos(val * Math.PI / 180), 0);

        const avgAngle = Math.atan2(sinSum / headingHistory.current.length, cosSum / headingHistory.current.length) * 180 / Math.PI;

        return (avgAngle + 360) % 360;
    };

    //heading
    useEffect(() => {
        let inscricao: Location.LocationSubscription | null = null;

        const headingPermission = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.log("Permissão de heading Negada")
                return;
            }

            inscricao = await Location.watchHeadingAsync((headingData) => {
                const newHeading = headingData.trueHeading;
                const smoothed = smoothHeading(newHeading)
                setHeading(smoothed)
            })
        }

        headingPermission();

        return () => {
            if (inscricao) inscricao.remove();
            inscricao = null
        }

    }, [start])

    useEffect(() => {
        const tiles = tileGridForRegion({
            latitude: -20.209094,
            longitude: -50.9295278,
            latitudeDelta: 0.0005,
            longitudeDelta: 0.0001,
        }, 15, 18)

        // console.log(tiles)
    }, [])


    useEffect(() => {
        if(mapState.mapRegion) {
            tileGridForRegion(mapState.mapRegion, 2, 16)
        }
    }, [mapState.mapRegion])

    return {
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
    }
}