import { ApiUrlService } from './api-url.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BotServerService {

  protected hostApiUrl;
  protected httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  protected isReady = false;
  protected readySubject = new Subject<void>();

  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService
    ) {
    this.apiUrlService.apiUrl.subscribe((url) => {
      if (url) {
        console.log('Set API URL: ', url);
        this.hostApiUrl = url;
        this.isReady = true;
        this.readySubject.next();
      }
    });
  }

  public get ready(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        const sub = this.readySubject.subscribe(() => {
          resolve();
          sub.unsubscribe();
        });
      }
    });
  }

  public async addBotToGame(gameMaster: string) {
    if (!this.isReady) {
      throw new Error('BotServerService is not ready yet');
    }
    const nbBots = 1;
    const url = `${this.hostApiUrl}/bot/add?game=${gameMaster}&nbBots=${nbBots}`;
    return this.http.put(url, {}, this.httpOptions).toPromise();
  }
}
