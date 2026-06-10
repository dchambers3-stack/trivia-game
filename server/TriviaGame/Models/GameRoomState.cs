namespace TriviaGame.Models
{
    public class GameRoomState
    {
        public List<PlayerState> Players { get; set; } = new();
        public int CurrentPlayerIndex { get; set; } = 0;
        public int CurrentQuestionIndex { get; set; } = 0;
        public bool GameOver { get; set; } = false;
        public int PlayersAnsweredCount { get; set; } = 0;
        public int PlayersExpectedForCurrentQuestion { get; set; }
    }

    public class PlayerState
    {
        public string Name { get; set; } = string.Empty;
        public int Points { get; set; } = 0;
        public bool IsEliminated { get; set; } = false;
    }
}
