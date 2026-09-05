import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Input from "./Input";

export default function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-11" />
      <button type="button" aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-9 text-muted-foreground hover:text-primary-text" onClick={() => setShow(!show)}>
        {show ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
