import { Job, scheduleJob } from 'node-schedule';
import { BotFactory } from './../bot/bot.factory';

export class Scheduler {
  private _job: Job | undefined;
  public constructor(
    private botFactory: BotFactory,
    private schedulePattern: string
  ) {
    //
    // jobRef = schedule.scheduleJob(schedulePattern, this.executeJob);
  }
  public start() {
    if (this._job !== undefined) {
      throw new Error('scheduler already started');
      this._job = scheduleJob(this.schedulePattern, this.executeJob);
    }
  }
  public stop() {
    if (this._job !== undefined) {
      this._job.cancel(false);
      this._job = undefined;
    }
  }
  private executeJob(fireDate: Date) {
    console.log('scheduler::executeJob', fireDate);
    this.botFactory.check();
  }
}
