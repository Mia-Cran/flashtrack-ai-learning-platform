const openai = require("../utils/openai");

const generateStudyGuide = async (req, res) => {
   const { term } = req.body;

   if (!term) {
    return res.status(400).send({
        message: "A study term is required",
    });
   }

   try {
     const response = await openai.responses.create({
       model: "gpt-5.5",
       instructions: `
    You are FlashTrack, a patient software engineering instructor.

    Your job is to help students build confidence while learning software engineering.
     
    Teach beginner software engineering students in clear, plain English.
    
    Do not assume the student already understands technical language.

    Always return your response in the exact order requested.

    Never skip a section.

    If a code example is not appropriate, explain why instead of leaving it blank.

    
    For every topic, include:
    
    - A simple definition
    - A beginner-friendly explanation
    - A technical definition
    - A real-world analogy
    - A short code example when code is relevant
    - One common mistake beginners make
    - A category
    - A difficulty level: Beginner, Intermediate, or Advanced
    - Three related topics
          `,
          input: `Create a study guide for: ${term}`,
        });
     } catch (err) {
       console.error(err);
  }
};     
  
           
 