import { startupSnapshot } from "node:v8";


// BSON checks snapshot state during import. Older Bun versions throw here.
try {
  startupSnapshot.isBuildingSnapshot();
} catch (error) {
  if (
    error instanceof Error &&
    "code" in error &&
    error.code === "ERR_NOT_IMPLEMENTED"
  ) {
    startupSnapshot.isBuildingSnapshot = () => false;
  } else {
    throw error;
  }
}
