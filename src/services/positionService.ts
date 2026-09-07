import { championPositions } from "../data/championPositions.js";
import { summonerSpellPositions } from "../data/summonerSpellPositions.js";
import { summonerSpells } from "../data/summonerSpells.js";
import { getChampion } from "./championService.js";

const normalPositions = ["TOP", "MID", "BOT", "SUPPORT"];


export function determinePositions(team: any[]) {

    const junglePlayer = team.find(
        (participant: any) =>
            participant.spell1Id === 11 ||
            participant.spell2Id === 11
    );

    if (!junglePlayer) {
        return [];
    }

    const positions = [
        {
            participant: junglePlayer,
            position: "JUNGLE"
        }
    ];

    // Remove jungler
    const remainingPlayers = team.filter(
        (participant: any) => participant !== junglePlayer
    );

    // Calculate position scores for the remaining 4 players
    const playerScores = remainingPlayers.map(
        (participant: any) => {

            const champion = getChampion(participant.championId);

            if (!champion) {
                throw new Error(
                    `Champion not found: ${participant.championId}`
                );
            }

            // Copy champion scores so we don't modify
            // the original championPositions data
            const baseScores = championPositions[champion.name] ?? {
                TOP: 0,
                MID: 0,
                BOT: 0,
                SUPPORT: 0
            };

            const scores = {
                ...baseScores
            };

            // Get both summoner spells
            const spell1 = summonerSpells[participant.spell1Id];
            const spell2 = summonerSpells[participant.spell2Id];

            // Get position bonuses for both spells
            const spell1Bonus = summonerSpellPositions[spell1];
            const spell2Bonus = summonerSpellPositions[spell2];

            // Add spell bonuses
            addSpellBonus(scores, spell1Bonus);
            addSpellBonus(scores, spell2Bonus);

            return {
                participant,
                scores
            };
        }
    );


    // Generate all possible assignments
    const assignments = findAssignments();

    let bestAssignment = null;
    let bestScore = -1;


    // Find the assignment with the highest total score
    for (const assignment of assignments) {

        const score = calculateScore(assignment, playerScores);

        if (score > bestScore) {
            bestScore = score;
            bestAssignment = assignment;
        }
    }


    if (bestAssignment) {
        for (const assignedPlayer of bestAssignment) {

            positions.push({
                participant: playerScores[assignedPlayer.playerIndex].participant,
                position: assignedPlayer.position
            });

        }
    }

    return positions;
}


function addSpellBonus(scores: any, spellBonuses: any) {
    if (!spellBonuses) {
        return;
    }

    for (const position of Object.keys(spellBonuses)) {
        scores[position] += spellBonuses[position];
    }
}

function findAssignments() {

    const assignments = [];

    for (const pos1 of normalPositions) {

        for (const pos2 of normalPositions) {

            if (pos2 === pos1) {
                continue;
            }

            for (const pos3 of normalPositions) {

                if (
                    pos3 === pos1 ||
                    pos3 === pos2
                ) {
                    continue;
                }

                for (const pos4 of normalPositions) {

                    if (
                        pos4 === pos1 ||
                        pos4 === pos2 ||
                        pos4 === pos3
                    ) {
                        continue;
                    }

                    assignments.push([
                        {
                            playerIndex: 0,
                            position: pos1
                        },
                        {
                            playerIndex: 1,
                            position: pos2
                        },
                        {
                            playerIndex: 2,
                            position: pos3
                        },
                        {
                            playerIndex: 3,
                            position: pos4
                        }
                    ]);
                }
            }
        }
    }

    return assignments;
}


function calculateScore(assignment: any[], playerScores: any[]) {

    let totalScore = 0;

    for (const assignedPlayer of assignment) {
        const player = playerScores[assignedPlayer.playerIndex];
        totalScore += player.scores[assignedPlayer.position];
    }

    return totalScore;
}