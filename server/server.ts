import axios from 'axios';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import express from 'express';
const app = express();

type childType = ChildProcessWithoutNullStreams;
type childCallback<T = {}> = (child: childType) => T;

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

function escapeBacktick(text: string): string {
  return text.replace(/`/g, '\\`');
}



function buildPrompt(prompt): string {
  if (prompt.selectedText)
    return `${prompt.content}, your answer must contain only code-snippet, no explaination or introduction as the answer is used in an api, here is the code snippet: ${codeSnippet(prompt.selectedText)}`;
  return prompt.content;
}

app.post('/user', (req, res) => {
  const { name, surname } = req.body;
  res.send(`Hello, ${name} ${surname}!`);
});


const buildCommand = (payload) => {
  return `echo "${escapeBacktick(payload.prompt)}" | ollama run ${payload.model}`;
}

interface job {
  id: number,
  isRunning: boolean,
  child: childType | undefined,
  callback: childCallback,
  command: string
}

namespace ollama {
  class PromptScheduler {
    jobs: job[] = [];
    id = 0;
    constructor() {

    }

    jobsCount() {
      return this.jobs.length;
    }

    getJobById(id: job['id']) {
      return this.jobs.find(job => job.id == id)
    }

    getJobs() {
      return this.jobs;
    }

    addJob(command: job['command'], callback: childCallback) {
      const newJob = { id: this.id++, command: command, isRunning: false, callback, child: undefined };
      this.jobs = [...this.jobs, newJob];
      return newJob;
    }

    startJob(id: job['id']) {
      let job = this.getJobById(id);
      if (!job) {
        // Handle error
        return;
      }
      const child = spawn(job.command, { shell: true });
      job.child = child;
      job.callback(child);
    }
  }
}

app.post('/prompt', async (req, res) => {
  const data: prompt = req.body;
  const payload: ollamaPayload = {
    model: 'llama2',
    prompt: buildPrompt(data)
  }
  const command = buildCommand(payload);
  console.log(`[CMD] ${command}`);
  console.log(`[DATA] ${JSON.stringify(data)}`);
  console.log(`[PAYLOAD]`, payload);

  const child = spawn(command, { shell: true });

  child.stdout.on('data', (chunk) => {
    console.log(`${chunk}`);
  });

  function isAsciiSpinner(chunk: string): boolean {
    const asciiSpinnerStates = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    return asciiSpinnerStates.some(state => chunk.includes(state));
  }

  child.stderr.on('data', (chunk) => {
    if (isAsciiSpinner(chunk)) {
      console.log(`${chunk}`);
    } else {
      if (chunk.length != 6) {
        console.error(`Received error chunk ${chunk.length}: ${chunk}`);
      }
    }
  });

  child.on('close', (code) => {
    console.log(`Command exited with code ${code}`);
  });

  res.send('Ok');
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
