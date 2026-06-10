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
            if (_rooms.ContainsKey(roomCode))
            {
                var player = _rooms[roomCode].Players.FirstOrDefault(p => p.Name == playerName);
                if (player != null)
                    _rooms[roomCode].Players.Remove(player);
                await Clients.Group(roomCode).SendAsync("PlayersUpdated", _rooms[roomCode].Players);
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
