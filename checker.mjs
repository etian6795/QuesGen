import OpenAI from "openai";
import e from "express";

const openai = new OpenAI();

async function queryAnswer(prompt, answer) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Is \"" + answer + "\" a valid answer to \"" + prompt + "\"? Answer either Yes or No."}],
        // messages: [{ role: "user", content: `Take this family-feud style academic trivia question` + prompt + `and this answer to that question: ` + answer + `. You will assess how correct of an answer it is to the question, giving it a score of 0-100, with 100 being a "perfect" answer and 0 being an absolutely incorrect answer. Finally, you will use all of the context you have to revise your initial score. Format your final score as the following:
        //                                                                                                                                                                                                                     FINAL_SCORE: {Score}`}],
    });
    const result = response.choices[0]?.message?.content || "";
    return result;
    // if (parseInt(result.split("FINAL_SCORE: ")[1]) >= 50) {
    //     return "Yes"
    // } else {
    //     return "No"
    // }
}

export async function checkAnswer(prompt, answer) {
    const result = await queryAnswer(prompt, answer)
    return result.toLowerCase().includes("yes");
}

async function queryQuestion(topic) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Provide an open-ended question related to "+topic+" with around 30-40 possible answers, that are one to three words long. Only reply with the question"}],
    });
    const result = response.choices[0]?.message?.content || "";
    return result;
}

export async function getQuestion(topic) {
    const result = await queryQuestion(topic);
    return result;
}

export async function getNotesQuestion(notes) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: notes + `\n Generate 20-40 family-feud style questions revolving around my notes. Make them open-ended, not specific to certain examples, concise with short answers, and make them good tests of knowledge for me.
            Format the questions as such
            1. QUESTION
            2. QUESTION
            ...
            Do not add any text before or after the list`}],
    });
    console.log(notes+" notes");
    const result = response.choices[0]?.message?.content || "";
    console.log("result: "+result);
    return result;
}