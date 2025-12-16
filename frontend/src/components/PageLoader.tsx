import React from "react";
import { LoaderIcon } from "lucide-react";

const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <LoaderIcon className="size-10 animate-spin" />
    </div>
  );
};

export default PageLoader;
