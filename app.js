const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

app.use(express.json())

let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log('DB Error message ${e.message}')
    process.exit(1)
  }
}

app.listen(3000, () => {
  console.log('Server running at http://localshost:3000/')
})

initializeDBAndServer()

const convertSnakeToCamel = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

//Returns a list of all the players in the player table
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `SELECT * from player_details;`
  const playersArray = await db.all(getPlayersQuery)
  response.send(playersArray.map(eachPlayer => convertSnakeToCamel(eachPlayer)))
})

//Returns a specific player based on the player ID
app.get('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`
  const dbResponse = await db.get(getPlayerQuery)
  response.send(convertSnakeToCamel(dbResponse))
})

//Updates the details of a specific player based on the player ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerQuery = `UPDATE player_details SET player_name='${playerName}';`
  const dbResponse = await db.get(updatePlayerQuery)
  response.send('Player Details Updated')
})

const convertMatchToCamel = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

//Returns the match details of a specific match
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `SELECT * from match_details WHERE match_id=${matchId};`
  const dbResponse = await db.get(getMatchQuery)
  response.send(convertMatchToCamel(dbResponse))
})

const converMatchDetailsToCamelCase = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

//Returns a list of all the matches of a player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchPlayerQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id=${playerId};`
  const playerMatches = await db.all(getMatchPlayerQuery)
  response.send(
    playerMatches.map(eachMatch => converMatchDetailsToCamelCase(eachMatch)),
  )
})

const convertPlayer = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

//Returns a list of players of a specific match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id=${matchId};`
  const playersArray = await db.all(getMatchPlayersQuery)
  response.send(playersArray.map(eachItem => convertPlayer(eachItem)))
})

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getMatchPlayerQuery = `SELECT player_is AS playerId, player_name AS playerName, SUM(score) AS totalSCore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes FROM player_match_score NATURAL JOIN player_details WHERE player_id=${playerId};`
  const dbResponse = await db.get(getMatchPlayerQuery)
  response.send(dbResponse)
})

module.exports = app
