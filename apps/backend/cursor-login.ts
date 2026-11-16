const packageName = "@cursor/sdk";

try {
  const { Cursor } = await import(packageName);
  console.log("Opening Cursor sign in in your browser.");
  await Cursor.auth.login({
    onLoginUrl: (url: string) => {
      console.log(`Open this link to sign in: ${url}`);
    },
  });
  console.log("Cursor sign in completed.");
} catch (error) {
  console.error(
    "Cursor sign in failed. Make sure dependencies are installed, then try again.",
  );
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
