# @astroimg/trywakeup

A lightweight JS utility to wakeup app (similar to Umeng `trackLinkWakeup`).

## Installation

```bash
npm install @astroimg/trywakeup
```

## Usage

```js
import Wakeup from "@astroimg/wakeup";

const { startULink } = Wakeup;

startULink([
  {
    id: uLinkId,
    data,
    selector,
    timeout: 1500,
    iosDeepLinksData,
    androidDeepLinksData,
    lazy: false,
    useOpenInBrowerTips: "default",
    proxyOpenDownload: function (defaultAction, linkInstance) {
      if (linkInstance.solution) {
        if (
          window.navigator.userAgent.toLowerCase().includes("micromessenger")
        ) {
          defaultAction();
        } else {
          window.location.href = linkInstance.solution.downloadUrl;
        }
      }
    },
  },
]);
```

## License

MIT License © 2025 Felix Wang
