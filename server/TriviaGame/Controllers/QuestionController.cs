using Microsoft.AspNetCore.Mvc;
using TriviaGame.Models;
using TriviaGame.Services;

namespace TriviaGame.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class QuestionController : ControllerBase
    {
        private readonly QuestionService _questionService;

        public QuestionController(QuestionService questionService)
        {
            _questionService = questionService;
        }

        [HttpGet]
        public async Task<ActionResult<List<QuestionModel>>> GetQuestion(int categoryId)
        {
            var question = await _questionService.GetQuestions(categoryId);
            return Ok(question);
        }
    }
}
