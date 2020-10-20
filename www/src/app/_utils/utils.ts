import { BigNumber } from 'ethers';
export class Utils {
  public static ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
  public static USDC_decimals = BigNumber.from(10).pow(6);
  public static ETH_decimals = BigNumber.from(10).pow(18);
  public static MATIC_decimals = BigNumber.from(10).pow(18);
  public static Deg2Rad(angle_deg: number): number {
    return angle_deg * (Math.PI / 180);
  }
  public static Rad2Deg(angle_rad: number): number {
    return angle_rad * (180 / Math.PI);
  }

  public static getBalanceAsNumber(bn: BigNumber, decimals: BigNumber, accur: number): number {
    console.log('bn', bn.toString());
    const factor = Math.round(1/accur);
    console.log('factor', factor);
    const r1 = Utils.ETH_decimals.div(factor);
    console.log('r1', r1.toString());
    const r2 = bn.div(r1);
    console.log('r2', r2.toString());
    const r3 = r2.toNumber();
    console.log('r3', r3);
    const r4 = r3 / factor;
    console.log('r4', r4);
    return r4;
  }
}
