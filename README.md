# Prototype R&D for micRunner project

### current state:
- [x] basic react app scaffold
- [x] ci pipeline deployment to [protomic.radmuffin.click](https://protomic.radmuffin.click)
- [x] skeleton ui
- [x] create a simple peer-to-peer connection
- [x] text chat works


### next steps:
- [ ] make connectivity reliable!
- [ ] custom id for connection instead of ugly generated one (on peer initialization)
- [ ] explore logic for initializing connections with LAN/QRCodes...
  - would be a good other project if someone wants to tackle QR generation APIs
  - qrcode.react might be a good library, bonus points for not being an API
- [ ] audio transmission
  - [ ] explore audio quality
  - [ ] feedback issues??????
- [ ] split index.tsx into presenter and view for better architecture? not huge priority for prototype but good practice


### connectivity issue:
- We'll need to reproduce and test failures
- I'm adding logging which goes to the console
- chrome and firefox have devtools for webrtc debugging (chrome://webrtc-internals/ and about:webrtc)
- may need to try different STUN/TURN servers
  - [ ] more research possibly needed here
  - [ ] possibly need to implement a TURN server (hope not)
- [ ] diagnosing failing connections is #1 priority
