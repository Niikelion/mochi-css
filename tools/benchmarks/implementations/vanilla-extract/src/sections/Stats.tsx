import { StatsSection, StatsGrid, StatCard } from "./Stats.styled"

export function Stats() {
    return (
        <StatsSection>
            <StatsGrid>
                <StatCard>
                    <span>0 kB</span>
                    <span>Runtime overhead</span>
                </StatCard>
                <StatCard>
                    <span>100%</span>
                    <span>Type safe</span>
                </StatCard>
                <StatCard>
                    <span>Build time</span>
                    <span>Extraction</span>
                </StatCard>
            </StatsGrid>
        </StatsSection>
    )
}
