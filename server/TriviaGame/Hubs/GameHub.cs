using Microsoft.AspNetCore.SignalR;
using TriviaGame.Models;

namespace TriviaGame.Hubs
{
    public class GameHub : Hub
    {
        public async Task SendMessage(string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", message);
        }

        private static Dictionary<string, GameRoomState> _rooms = new();
        private static readonly int[] PrizeLadder =
        {
            100,
            200,
            300,
            500,
            1000,
            2000,
            4000,
            8000,
            16000,
            32000,
            64000,
            125000,
            250000,
            500000,
            1000000,
        };

        private static int SafeHaven(int questionIndex)
        {
            if (questionIndex < 5)
                return 0;
            if (questionIndex < 10)
                return PrizeLadder[4];
            return PrizeLadder[9];
        }

        private static void AdvanceTurn(GameRoomState room)
        {
            room.PlayersAnsweredCount++;
            if (room.PlayersAnsweredCount >= room.PlayersExpectedForCurrentQuestion)
            {
                room.CurrentQuestionIndex++;
                room.PlayersAnsweredCount = 0;
                // Snapshot active players for the NEW question, after all eliminations this round
                room.PlayersExpectedForCurrentQuestion = room.Players.Count(p => !p.IsEliminated);
            }

            var activePlayers = room.Players.Where(p => !p.IsEliminated).ToList();
            if (!activePlayers.Any() || room.CurrentQuestionIndex >= PrizeLadder.Length)
            {
                room.GameOver = true;
                return;
            }

            room.CurrentPlayerIndex = (room.CurrentPlayerIndex + 1) % room.Players.Count;
            while (room.Players[room.CurrentPlayerIndex].IsEliminated)
            {
                room.CurrentPlayerIndex = (room.CurrentPlayerIndex + 1) % room.Players.Count;
            }
        }

        public async Task SubmitAnswer(string roomCode, string playerName, bool isCorrect)
        {
            var room = _rooms[roomCode];
            var player = room.Players.FirstOrDefault(p => p.Name == playerName);

            if (player == null || player.IsEliminated)
                return;

            if (isCorrect)
            {
                player.Points = PrizeLadder[room.CurrentQuestionIndex];
            }
            else
            {
                player.IsEliminated = true;
                player.Points = SafeHaven(room.CurrentQuestionIndex);
            }

            await Clients.Group(roomCode).SendAsync("PlayersUpdated", room.Players);
            AdvanceTurn(room);

            if (room.GameOver)
            {
                await Clients.Group(roomCode).SendAsync("GameOver", room.Players);
                return;
            }

            await Clients
                .Group(roomCode)
                .SendAsync(
                    "TurnChanged",
                    room.Players[room.CurrentPlayerIndex].Name,
                    room.CurrentQuestionIndex
                );
        }

        public async Task JoinRoom(string roomCode, string playerName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
            if (!_rooms.ContainsKey(roomCode))
            {
                _rooms[roomCode] = new GameRoomState();
            }
            if (!_rooms[roomCode].Players.Any(p => p.Name == playerName))
                _rooms[roomCode].Players.Add(new PlayerState { Name = playerName });
            await Clients.Group(roomCode).SendAsync("PlayersUpdated", _rooms[roomCode].Players);
        }

        public async Task LeaveRoom(string roomCode, string playerName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
            if (!_rooms.ContainsKey(roomCode))
                return;

            var room = _rooms[roomCode];
            var leavingIndex = room.Players.FindIndex(p => p.Name == playerName);
            if (leavingIndex == -1)
                return;

            var wasCurrentPlayersTurn = leavingIndex == room.CurrentPlayerIndex;
            room.Players.RemoveAt(leavingIndex);

            await Clients.Group(roomCode).SendAsync("PlayersUpdated", room.Players);
            await Clients.Group(roomCode).SendAsync("PlayerLeft", playerName);

            if (room.Players.Count <= 1)
            {
                room.GameOver = true;
                await Clients.Group(roomCode).SendAsync("GameOver", room.Players);
                return;
            }

            // The list just shifted left past this point, keep the turn pointer valid.
            if (leavingIndex < room.CurrentPlayerIndex)
                room.CurrentPlayerIndex--;
            room.CurrentPlayerIndex %= room.Players.Count;

            // A round can't expect more answers than there are active players left.
            var activeCount = room.Players.Count(p => !p.IsEliminated);
            room.PlayersExpectedForCurrentQuestion = Math.Min(
                room.PlayersExpectedForCurrentQuestion,
                activeCount
            );
            if (room.PlayersAnsweredCount >= room.PlayersExpectedForCurrentQuestion)
            {
                room.CurrentQuestionIndex++;
                room.PlayersAnsweredCount = 0;
                room.PlayersExpectedForCurrentQuestion = activeCount;
            }

            if (activeCount == 0 || room.CurrentQuestionIndex >= PrizeLadder.Length)
            {
                room.GameOver = true;
                await Clients.Group(roomCode).SendAsync("GameOver", room.Players);
                return;
            }

            while (room.Players[room.CurrentPlayerIndex].IsEliminated)
            {
                room.CurrentPlayerIndex = (room.CurrentPlayerIndex + 1) % room.Players.Count;
            }

            if (wasCurrentPlayersTurn)
            {
                await Clients
                    .Group(roomCode)
                    .SendAsync(
                        "TurnChanged",
                        room.Players[room.CurrentPlayerIndex].Name,
                        room.CurrentQuestionIndex
                    );
            }
        }

        public async Task StartGame(string roomCode)
        {
            var room = _rooms[roomCode];
            room.PlayersExpectedForCurrentQuestion = room.Players.Count;
            var firstPlayer = room.Players[0].Name;
            await Clients.Group(roomCode).SendAsync("GameStarted");
            await Clients.Group(roomCode).SendAsync("TurnChanged", firstPlayer, 0);
        }

        public async Task ResetGame(string roomCode)
        {
            if (_rooms.ContainsKey(roomCode))
            {
                var existingPlayerNames = _rooms[roomCode].Players.Select(p => p.Name).ToList();
                _rooms[roomCode] = new GameRoomState();
                foreach (var name in existingPlayerNames)
                {
                    _rooms[roomCode].Players.Add(new PlayerState { Name = name });
                }
                await Clients.Group(roomCode).SendAsync("GameReset");
            }
        }
    }
}
