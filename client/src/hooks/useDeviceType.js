import { useEffect, useState } from "react";
import { getDeviceType } from "../utils/device";
export default function useDeviceType() {
  const [device, setDevice] = useState(getDeviceType);
  useEffect(() => {
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setDevice(getDeviceType()));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return device;
}
