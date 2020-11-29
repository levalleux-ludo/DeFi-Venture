import { Contract } from 'ethers';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { PortisL1Service } from './portis-l1.service';

export abstract class AbstractContractService<T> {

  protected _address: string;
  protected _contract: Contract;
  protected _contractWithSigner: Contract;
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

  public async setAddress(address: string): Promise<T> {
    return new Promise(async(resolve, reject) => {
      this._address = address;
      if ((this._address !== undefined) && (this._address !== null) && (this._address !== '')) {
        if (!(this._contract) || (this._contract.address !== address)) {
          if (this._contract) {
            this.unsubscribeToEvents();
            this.isReady = false;
            await this.setContract(undefined);
          }
          await this.resetData();
          this._onUpdate.next(undefined);
          await (new Contract(address, this.contractJSON.abi, this.portisL1Service?.provider)).deployed().then(async (contract) => {
            await this.setContract(contract);
            // We use a separate instance of contract to send signed transaction
            this._contractWithSigner = contract.connect(this.portisL1Service.signer);
            this.subscribeToEvents();
            this.isReady = true;
            this.readySubject.next();
            const {data, hasChanged} = await this.refreshData();
            if (hasChanged) {
              this._onUpdate.next(data);
            }
            resolve(data);
          }).catch(async(e) => {
            console.error(e);
            this.isReady = false;
            await this.setContract(undefined);
            this._contractWithSigner = undefined;
            this._onUpdate.next(undefined);
            reject(e);
          });
        } else {
          resolve(this.data);
        }
      } else {
        this.isReady = false;
        await this.setContract(undefined);
        this._contractWithSigner = undefined;
        this._onUpdate.next(undefined);
        resolve(undefined);
      }
    });
  }

  public async setContract(value: Contract) {
    this._contract = value;
    await this._onContractSet(value);
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
  protected abstract unsubscribeToEvents();
  protected abstract async _onContractSet(value: Contract);

  protected async recordEvent(event: any) {
    this._events.push(event);
    this._eventsSubject.next(event);
    const {data, hasChanged} = await this.refreshData();
    if (hasChanged) {
      this._onUpdate.next(data);
    }
  }

  protected abstract async resetData();
  protected abstract async refreshData(): Promise<{data: T, hasChanged: boolean}>;

}
