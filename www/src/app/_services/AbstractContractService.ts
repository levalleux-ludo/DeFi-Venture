import { Contract } from 'ethers';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { PortisL1Service } from './portis-l1.service';

export abstract class AbstractContractService<T> {

  protected _address: string;
  protected _contract: Contract;
  protected isReady = false;
  protected readySubject = new Subject<void>();
  protected _events = [];
  protected _eventsSubject = new Subject();
  protected _onUpdate = new BehaviorSubject<T>(undefined);

  constructor(
    protected contractJSON: any,
    protected portisL1Service: PortisL1Service
  ) {

  }

  public get address() {
    return this._address;
  }

  public get ready(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        this.readySubject.subscribe(() => {
          resolve();
        });
      }
    });
  }

  public get onUpdate(): Observable<T> {
    return this._onUpdate.asObservable();
  }

  public get data(): T {
    return this._onUpdate.value;
  }

  public async setAddress(address: string) {
    this._address = address;
    if ((this._address !== undefined) && (this._address !== null) && (this._address !== '')) {
        await (new Contract(address, this.contractJSON.abi, this.portisL1Service?.signer())).deployed().then(async (contract) => {
        this._contract = contract;
        this.subscribeToEvents();
        this.isReady = true;
        await this.refreshData();
      }).catch(e => {
        console.error(e);
        this._contract = undefined;
      });
    } else {
      this._contract = undefined;
    }
    this.isReady = true;
    this.readySubject.next();
  }

  public get contract(): Contract {
    return this._contract;
  }

  public get events(): any[] {
    return this._events;
  }

  public get onEvent(): Observable<any> {
    return this._eventsSubject.asObservable();
  }

  protected abstract subscribeToEvents();

  protected recordEvent(event: any) {
    this._events.push(event);
    this._eventsSubject.next(event);
    this.refreshData();
  }

  protected abstract async refreshData();

}
