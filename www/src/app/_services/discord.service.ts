import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { ApiUrlService } from './api-url.service';


const DISCORD_URL_SUFFIX = '/discord';
const LOGIN_SUFFIX = '/login';
const WAIT_SUFFIX = '/wait';
const USER_SUFFIX = '/user';
const GUILD_ID = '773475946597842954';
const CHANNELS_ID = {
  general: '773475946597842956',
};

export interface DiscordUserData {userId: string; username: string;}

@Injectable({
  providedIn: 'root'
})
export class DiscordService {
  protected hostApiUrl;
  protected isReady = false;
  protected readySubject = new Subject<void>();
  protected userSubject = new BehaviorSubject<DiscordUserData>(undefined);

  constructor(
    @Inject(DOCUMENT) readonly document: Document,
    private apiUrlService: ApiUrlService,
    private http: HttpClient
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

  get GUILD_ID(): string {
    return GUILD_ID;
  }

  get CHANNELS_ID() {
    return CHANNELS_ID;
  }

  /** The Window object from Document defaultView */
  get window(): Window { return this.document.defaultView; }

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

  public get userData(): Observable<DiscordUserData> {
    return this.userSubject.asObservable();
  }

  public async getUserData(account: string): Promise<DiscordUserData | undefined> {
    return new Promise<DiscordUserData>( (resolve, reject) => {
      this.ready.then(() => {
        const urlUser = `${this.hostApiUrl}${DISCORD_URL_SUFFIX}${USER_SUFFIX}/${account}`;
        const sub = this.http.get<{userId: string, username: string}>(urlUser).subscribe((userData) => {
          sub.unsubscribe();
          if (userData) {
            this.userSubject.next(userData);
            resolve(userData);
          } else {
            resolve(undefined);
          }
        }, err => {
          reject(err);
        });
      });
    });
  }


  public jumpToLogin(account: string): Promise<string> {
    const urlJump = `${this.hostApiUrl}${DISCORD_URL_SUFFIX}${LOGIN_SUFFIX}?api_url=${this.hostApiUrl}&account=${account}`;
    const urlWait = `${this.hostApiUrl}${DISCORD_URL_SUFFIX}${WAIT_SUFFIX}/${account}`;
    console.log('jumpTo', urlJump);
    return new Promise<string>( (resolve, reject) => {
      this.ready.then(() => {
        this.window.open(urlJump, '_blank');
        // try { resolve(!!this.window.open(url, '_blank')); }
        // catch(e) { reject(e); }
        const sub = this.http.get<{userId: string, username: string}>(urlWait).subscribe(({userId, username}) => {
          sub.unsubscribe();
          console.log('discord Id:', userId, username);
          this.userSubject.next({userId, username});
          resolve(userId);
        }, err => {
          reject(err);
        });
      }).catch(e => reject(e));
  });
  }
}
