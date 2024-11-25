import QRCode from "qrcode";

export class DesignConnection {
  private pc;
  private dataChannel;
  private qrContainer;

  constructor(qrContainer: HTMLCanvasElement) {
    this.pc = new RTCPeerConnection();
    this.dataChannel = this.pc.createDataChannel("imageData");
    this.setupDataChannel();
    this.qrContainer = qrContainer;
  }

  private setupDataChannel() {
    this.dataChannel.onopen = () => {
      console.log("Connected!");
      this.dataChannel.send("Hello from web!");
    };
  }

  createConnectionQR() {
    this.pc
      .createOffer()
      .then((offer) => {
        console.log("offering...");
        return this.pc.setLocalDescription(offer);
      })
      .then(() => {
        return new Promise<void>((resolve) => {
          if (this.pc.iceGatheringState === "complete") {
            resolve();
          } else {
            this.pc.onicecandidate = (e) => {
              if (!e.candidate) resolve();
            };
          }
        });
      })
      .then(() => {
        const connInfo = btoa(
          JSON.stringify({
            sdp: this.pc.localDescription,
          })
        );

        QRCode.toDataURL(this.qrContainer, connInfo, () => {
          console.log("Inside QR Callback");
        });
      })
      .catch((err) => console.error("Error:", err));
  }

  getState(): string {
    return this.dataChannel.readyState;
  }

  sendMessage() {
    console.log(this.dataChannel.readyState);
    if (this.dataChannel.readyState === "open") {
      this.dataChannel.send("Hello therer my friendd");
    }
  }
}
