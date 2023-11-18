import axios from 'axios';
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
});

interface prompt {
  content: string,
  selectedText: string
}

interface ollamaPayload {
  model: string,
  prompt: string
}

function codeSnippet(text: string): string {
  return `\`\`\`${text}\`\`\``;
}


function buildPrompt(prompt): string {
  if (prompt.selectedText)
    return `${prompt.content}, here is the code snippet: ${codeSnippet(prompt.selectedText)}`;
  return prompt.content;
}

app.post('/user', (req, res) => {
  const { name, surname } = req.body;
  res.send(`Hello, ${name} ${surname}!`);
});


app.post('/prompt', async (req, res) => {
  const data: prompt = req.body;
  const payload: ollamaPayload = {
    model: 'llama2',
    prompt: buildPrompt(data)
  }

  console.log(`[DATA] ${JSON.stringify(data)}`);
  console.log(`[payload]`, payload);

  await axios.post('http://127.0.0.1:11434/api/generate', payload).then(response => {
    console.log('[RES]', response.data);
  }).catch(error => {
    console.log("error", error);
  });


  // await axios.post('http://localhost:3000', {
  //   payload
  // }).then(res => {
  //   console.log('[RES]', res);
  // }).catch(e => {
  //   console.log("error", e);
  // });
  res.send('Ok');
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
