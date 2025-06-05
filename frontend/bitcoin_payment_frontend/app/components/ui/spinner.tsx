import { Loader } from "lucide-react";

export const Spinner = ({ size = 20 }: { size?: number }) => (
  <Loader
    className={`animate-spin text-muted-foreground`}
    width={size}
    height={size}
  />
);
