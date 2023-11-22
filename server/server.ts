import axios from 'axios';
import { ollama } from './ollama';
import express from 'express';
import { codeSnippet, escapeBacktick, isAsciiSpinner } from './ollama/prompt/utils';
import { ollamaPrompt } from './ollama/prompt/types';
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
});

interface prompt {
  content: string,
  selectedText: string
}



function buildPrompt(prompt: prompt): string {
  if (prompt.selectedText)
    return `${prompt.content}, your answer must contain only code-snippet, no explaination or introduction as the answer is used in an api, here is the code snippet: ${codeSnippet(prompt.selectedText)}`;
  return prompt.content;
}

app.post('/user', (req, res) => {
  const { name, surname } = req.body;
  res.send(`Hello, ${name} ${surname}!`);
});


const buildCommand = (payload: ollamaPrompt) => {
  return `echo "${escapeBacktick(payload.prompt)}" | ollama run ${payload.model}`;
}

const promptScheduler = new ollama.prompt.scheduler();

// To test this endpoint with curl, use the following command:
// curl -X POST -H "Content-Type: application/json" -d '{"jobId": "<your_job_id>", "command": "<your_command>"}' http://localhost:<your_port>/test/jobstdin

app.post("/test/jobstdin", async (req, res) => {
  const { jobId, command } = req.body;
  const job = promptScheduler.getJobById(jobId);
  if (!job || !job.child) {
    res.status(404).send("Job not found");
    return;
  }
  const finalCommand = `${command}\n`;
  console.log(`sent command ${finalCommand}`);
  job.child.stdin.write(finalCommand);
  job.child.stdin.end();
  res.send("ok");
});

app.post("/test", async (req, res) => {
  const { command } = req.body;
  const job = promptScheduler.addJob(command, (child) => {
    child.stdout.on('data', (chunk) => {
      console.log(`${chunk}`);
    });

    child.stderr.on('data', (chunk) => {
      if (isAsciiSpinner(chunk)) {
        console.log(`${chunk}`);
      } else {
        if (chunk.length != 6) {
          console.error(`Received error chunk ${chunk.length}: ${chunk}`);
        }
      }
    });

    child.on('error', (error) => {
      console.error(`Failed to start subprocess: ${error}`);
    });

    child.on('close', (code) => {
      console.log(`Job closed with exit code ${code}`);
    });
    return 'ok';
  });
  console.log(`job id ${job.id}`);
  job.start();
  res.send("ok");
});

// To test this endpoint with curl, use the following command:
// curl -X POST -H "Content-Type: application/json" -d '{"model": "<your_model>", "prompt": "<your_prompt>"}' http://localhost:<your_port>/prompt

const _log = (marker: string, ...args) => {
  console.log(`[${marker}]`, args);
}

function handlePrompt(payload: ollamaPrompt) {
  const command = buildCommand(payload);
  _log("CMD", command);
   const job = promptScheduler.addJob(command, (child) => {
    child.stdout.on('data', (chunk) => {
      console.log(`${chunk}`);
    });

    child.stderr.on('data', (chunk) => {
      if (isAsciiSpinner(chunk)) {
        console.log(`${chunk}`);
      } else {
        if (chunk.length != 6) {
          console.error(`Received error chunk ${chunk.length}: ${chunk}`);
        }
      }
    });

    child.on('error', (error) => {
      console.error(`Failed to start subprocess: ${error}`);
    });

    child.on('close', (code) => {
      console.log(`Job closed with exit code ${code}`);
    });
    return true;
  });
  console.log(`job id ${job.id}`);
  job.start(); 
}

app.post('/prompt', async (req, res) => {
  const data: prompt = req.body;
  const payload: ollamaPrompt = {
    model: 'llama2',
    prompt: buildPrompt(data)
  }
  _log(`BODY`, JSON.stringify(req.body))
  _log(`DATA`, JSON.stringify(data));
  _log(`PAYLOAD`, payload);
  handlePrompt(payload);


  // const command = buildCommand(payload);
  // console.log(`[CMD] ${command}`);
  res.send('Ok');
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
