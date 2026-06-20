const express = require("express");
const router = express.Router();
const codingQuestionController = require("../controllers/codingQuestionController");

router.get("/questions", codingQuestionController.listQuestions);
router.post("/questions", codingQuestionController.createQuestion);
router.get("/questions/:id", codingQuestionController.getQuestion);
router.post("/questions/:id/run", codingQuestionController.runQuestion);
router.post("/questions/:id/submit", codingQuestionController.submitQuestion);

module.exports = router;
