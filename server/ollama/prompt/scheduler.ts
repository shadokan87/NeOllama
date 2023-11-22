import { ChildProcessWithoutNullStreams, spawn } from "child_process";

export type childType = ChildProcessWithoutNullStreams;
export type childCallback<T = {}> = (job: Job) => T;

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
        console.log("here", this.command);
        const child = spawn(this.command, { shell: true });
        this.child = child;
        this.callback(this);
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
        const job = this.getJobById(id);
        if (!job) {
            // Handle error
            return;
        }
        job.start();
        return job;
    }
}