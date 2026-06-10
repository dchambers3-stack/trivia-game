using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using TriviaGame.Models;

namespace TriviaGame.Services
{
    public class QuestionService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private static readonly SemaphoreSlim _lock = new(1, 1);

        public QuestionService(HttpClient httpClient, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _cache = cache;
        }

        public async Task<List<QuestionModel>> GetQuestions(int categoryId)
        {
            var cacheKey = $"questions_{categoryId}";
            if (_cache.TryGetValue(cacheKey, out List<QuestionModel> cachedQuestions))
            {
                return cachedQuestions;
            }

            await _lock.WaitAsync();
            try
            {
                if (_cache.TryGetValue(cacheKey, out cachedQuestions))
                    return cachedQuestions;

                return await FetchAndCacheQuestions(categoryId, cacheKey);
            }
            finally
            {
                _lock.Release();
            }
        }

        private async Task<List<QuestionModel>> FetchAndCacheQuestions(int categoryId, string cacheKey)
        {
            var response = await _httpClient.GetStringAsync(
                $"https://opentdb.com/api.php?amount=15&difficulty=easy&category={categoryId}&type=multiple"
            );
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var openTdbResponse = JsonSerializer.Deserialize<OpenTdbResponse>(response, options);
            var random = new Random();

            var questions = openTdbResponse.Results.Select(item =>
            {
                var shuffledAnswers = new List<string>
                {
                    System.Net.WebUtility.HtmlDecode(item.CorrectAnswer),
                }
                    .Concat(item.Incorrect_Answers.Select(a => System.Net.WebUtility.HtmlDecode(a)))
                    .OrderBy(x => random.Next())
                    .ToList();

                return new QuestionModel
                {
                    Question = System.Net.WebUtility.HtmlDecode(item.Question),
                    Answers = shuffledAnswers,
                    Correct = shuffledAnswers.IndexOf(
                        System.Net.WebUtility.HtmlDecode(item.CorrectAnswer)
                    ),
                };
            });
            var questionsList = questions.ToList();
            _cache.Set(cacheKey, questionsList, TimeSpan.FromMinutes(30));
            return questionsList;
        }
    }
}
