import QRCode from "qrcode";

/** QR generato in locale (libreria offline): nessuna chiamata a servizi esterni. */
export async function qrSvg(text: string, size = 120): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: size,
    margin: 1,
    color: { dark: "#0E2A33", light: "#FFFFFF" },
  });
}
