import { createContext, ReactNode, useContext, useState } from "react"

interface StepProgressContextProps {
    frota: string
    setFrota: (value: string) => void
    insumo: string
    setInsumo: (value: string) => void
    equipe: string
    setEquipe: (value: string) => void
    activeFrota: boolean
    setActiveFrota: (value: boolean) => void
    activeInsumos: boolean
    setActiveInsumos: (value: boolean) => void
    activeEquipe: boolean
    setActiveEquipe: (value: boolean) => void
    clear: () => void
}

const StepProgressContext = createContext({} as StepProgressContextProps);

function StepProgressProvider({ children }: { children: ReactNode }) {

    const [frota, setFrota] = useState("")
    const [insumo, setInsumo] = useState("")
    const [equipe, setEquipe] = useState("")
    const [activeFrota, setActiveFrota] = useState(false)
    const [activeInsumos, setActiveInsumos] = useState<boolean>(false);
    const [activeEquipe, setActiveEquipe] = useState<boolean>(false);

    function clear() {
        setFrota("")
        setInsumo("")
        setEquipe("")
    }

    return (
        <StepProgressContext value={{ clear, equipe, frota, insumo, activeFrota, activeEquipe, activeInsumos, setEquipe, setFrota, setInsumo, setActiveFrota, setActiveEquipe, setActiveInsumos }} >
            {children}
        </StepProgressContext>
    )
}

function useStepProgressContext() {
    const context = useContext(StepProgressContext)

    return context
}

export { useStepProgressContext, StepProgressProvider }