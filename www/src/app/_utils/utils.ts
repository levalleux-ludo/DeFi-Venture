export class Utils {
  public static Deg2Rad(angle_deg: number): number {
    return angle_deg * (Math.PI / 180);
  }
  public static Rad2Deg(angle_rad: number): number {
    return angle_rad * (180 / Math.PI);
  }
}
