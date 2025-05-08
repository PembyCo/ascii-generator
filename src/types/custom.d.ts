// This declaration file allows TypeScript to understand dynamic imports from CDNs

declare module "https://cdn.skypack.dev/figlet" {
  const figlet: any;
  export default figlet;
}

declare module "https://cdn.skypack.dev/figlet/importable-fonts/Standard.js" {
  const font: any;
  export default font;
} 