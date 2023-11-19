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

namespace ollama {
  export class Job {
    id: number;
    isRunning: boolean;
    child: childType | undefined;
    callback: childCallback;
    command: string;

    constructor(id: number, command: string, callback: childCallback) {
      this.id = id;
      this.command = command;
      this.callback = callback;
      this.isRunning = false;
      this.child = undefined;
    }

    start() {
      const child = spawn(this.command, { shell: true });
      this.child = child;
      this.callback(child);
    }
  }

  export class PromptScheduler {
    jobs: Job[] = [];
    id = 0;
    constructor() {

    }

    jobsCount() {
      return this.jobs.length;
    }

    getJobById(id: Job['id']) {
      return this.jobs.find(job => job.id == id)
    }

    getJobs() {
      return this.jobs;
    }

    addJob(command: Job['command'], callback: childCallback) {
      const newJob = new Job(this.id++, command, callback);
      this.jobs = [...this.jobs, newJob];
      return newJob;
    }

    startJob(id: Job['id']) {
      let job = this.getJobById(id);
      if (!job) {
        // Handle error
        return;
      }
      job.start();
    }
  }
}

const promptScheduler = new ollama.PromptScheduler();

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

  const job = a

  // const child = spawn(command, { shell: true });

  // child.stdout.on('data', (chunk) => {
  //   console.log(`${chunk}`);
  // });

  // function isAsciiSpinner(chunk: string): boolean {
  //   const asciiSpinnerStates = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  //   return asciiSpinnerStates.some(state => chunk.includes(state));
  // }

  // child.stderr.on('data', (chunk) => {
  //   if (isAsciiSpinner(chunk)) {
  //     console.log(`${chunk}`);
  //   } else {
  //     if (chunk.length != 6) {
  //       console.error(`Received error chunk ${chunk.length}: ${chunk}`);
  //     }
  //   }
  // });

  // child.on('close', (code) => {
  //   console.log(`Command exited with code ${code}`);
  // });

  res.send('Ok');
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
