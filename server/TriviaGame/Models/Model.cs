using System.Text.Json.Serialization;

namespace TriviaGame.Models
{
    public class QuestionModel
    {
        public string? Question { get; set; }
        public List<string>? Answers { get; set; }
        public int? Correct { get; set; }
    }

    public class OpenTDB_Model
    {
        public string? Question { get; set; }

        [JsonPropertyName("correct_answer")]
        public string? CorrectAnswer { get; set; }

        [JsonPropertyName("incorrect_answers")]
        public List<string>? Incorrect_Answers { get; set; }
    }

    public class OpenTdbResponse
    {
        public int ResponseCode { get; set; }
        public List<OpenTDB_Model>? Results { get; set; }
    }
}
