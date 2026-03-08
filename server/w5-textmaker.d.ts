declare module "w5-textmaker" {
  interface EphotoResult {
    image: string;
    [key: string]: any;
  }
  const w5botapi: {
    ephoto2(url: string, texts: string[]): Promise<EphotoResult>;
  };
  export default w5botapi;
}
