const Tournament = require('../models/tournament');
const User = require('../models/user');
const { Op } = require('sequelize');

// Create a new tournament
exports.createTournament = async (req, res) => {
    try {
        const { name, entryFee, maxPlayers, startTime } = req.body;
        
        // Validate entry fee
        if (entryFee < 0) {
            return res.status(400).json({ error: 'Entry fee must be positive' });
        }

        // Create tournament
        const tournament = await Tournament.create({
            name,
            entry_fee: entryFee,
            max_players: maxPlayers,
            start_time: startTime,
            created_by: req.user.id
        });

        res.status(201).json(tournament);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all tournaments
exports.getTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.findAll({
            include: [{
                model: User,
                as: 'creator',
                attributes: ['username']
            }],
            order: [['created_at', 'DESC']]
        });
        res.json(tournaments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get tournament details
exports.getTournamentDetails = async (req, res) => {
    try {
        const tournament = await Tournament.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['username']
                },
                {
                    model: User,
                    as: 'participants',
                    through: { attributes: [] }
                }
            ]
        });

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        res.json(tournament);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Register for a tournament
exports.registerForTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findByPk(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Check if tournament is full
        if (tournament.current_players >= tournament.max_players) {
            return res.status(400).json({ error: 'Tournament is full' });
        }

        // Check if user has enough chess coins
        const user = await User.findByPk(req.user.id);
        if (user.chess_coins < tournament.entry_fee) {
            return res.status(400).json({ error: 'Insufficient chess coins' });
        }

        // Deduct entry fee
        await user.update({
            chess_coins: user.chess_coins - tournament.entry_fee
        });

        // Add to prize pool
        await tournament.update({
            prize_pool: tournament.prize_pool + tournament.entry_fee,
            current_players: tournament.current_players + 1
        });

        // Register user
        await tournament.addParticipant(user);

        res.json({ message: 'Successfully registered for tournament' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Start tournament
exports.startTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findByPk(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Check if tournament has enough players
        if (tournament.current_players < 2) {
            return res.status(400).json({ error: 'Not enough players to start tournament' });
        }

        // Generate first round matches
        const participants = await tournament.getParticipants();
        const matches = [];

        for (let i = 0; i < participants.length; i += 2) {
            if (i + 1 < participants.length) {
                matches.push({
                    tournament_id: tournament.id,
                    round: 1,
                    player1_id: participants[i].id,
                    player2_id: participants[i + 1].id
                });
            } else {
                // Bye for odd number of players
                matches.push({
                    tournament_id: tournament.id,
                    round: 1,
                    player1_id: participants[i].id,
                    status: 'bye'
                });
            }
        }

        await tournament.update({ status: 'active' });
        await tournament.createMatches(matches);

        res.json({ message: 'Tournament started successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Report match result
exports.reportMatchResult = async (req, res) => {
    try {
        const { winnerId } = req.body;
        const match = await TournamentMatch.findByPk(req.params.matchId);
        
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Update match result
        await match.update({
            winner_id: winnerId,
            status: 'completed'
        });

        // Check if tournament is complete
        const tournament = await Tournament.findByPk(match.tournament_id);
        const remainingMatches = await TournamentMatch.count({
            where: {
                tournament_id: tournament.id,
                status: 'pending'
            }
        });

        if (remainingMatches === 0) {
            // Tournament is complete, distribute prizes
            const winner = await User.findByPk(winnerId);
            await winner.update({
                chess_coins: winner.chess_coins + tournament.prize_pool
            });

            await tournament.update({ status: 'completed' });
        }

        res.json({ message: 'Match result recorded successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; 