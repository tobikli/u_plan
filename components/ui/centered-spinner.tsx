import { Spinner } from "./spinner";

function CenteredSpinner() {
  return (
    <div className="flex flex-row min-h-screen justify-center items-center">
      <Spinner />
    </div>
  );
}

export default CenteredSpinner;